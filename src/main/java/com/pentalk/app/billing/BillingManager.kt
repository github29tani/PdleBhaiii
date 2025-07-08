package com.pentalk.app.billing

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.android.billingclient.api.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Data class representing a subscription offer
 */
data class SubscriptionOffer(
    val id: String,
    val type: String,
    val price: String,
    val priceAmountMicros: Long,
    val title: String,
    val description: String,
    val subscriptionPeriod: String,
    val freeTrialPeriod: String? = null
)

/**
 * Data class representing the result of a purchase
 */
data class PurchaseResult(
    val success: Boolean,
    val message: String,
    val purchase: Purchase? = null
)

/**
 * Enum representing subscription status
 */
enum class SubscriptionStatus {
    SUBSCRIBED,
    NOT_SUBSCRIBED,
    PENDING,
    UNKNOWN
}

/**
 * BillingManager handles all in-app purchases and subscriptions
 */
class BillingManager(private val context: Context) : PurchasesUpdatedListener, BillingClientStateListener {
    
    private val TAG = "BillingManager"
    
    // Billing client instance
    private var billingClient: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()
    
    // In-memory cache of available products
    private val _availableSubscriptions = MutableStateFlow<List<SubscriptionOffer>>(emptyList())
    val availableSubscriptions = _availableSubscriptions.asStateFlow()
    
    // Current subscription status
    private val _subscriptionStatus = MutableStateFlow<SubscriptionStatus>(SubscriptionStatus.UNKNOWN)
    val subscriptionStatus = _subscriptionStatus.asStateFlow()
    
    // Purchase result flow
    private val _purchaseFlowResult = MutableStateFlow<PurchaseResult?>(null)
    val purchaseFlowResult = _purchaseFlowResult.asStateFlow()
    
    init {
        // Initialize the billing client
        connectToBillingService()
    }
    
    /**
     * Connect to the Google Play Billing service
     */
    private fun connectToBillingService() {
        if (!billingClient.isReady) {
            billingClient.startConnection(this)
        }
    }
    
    /**
     * Refresh the subscription status from Google Play
     */
    fun refreshSubscriptionStatus() {
        if (!billingClient.isReady) {
            connectToBillingService()
            return
        }
        
        queryPurchases()
    }
    
    /**
     * Query purchases to check subscription status
     */
    private fun queryPurchases() {
        if (!billingClient.isReady) {
            _subscriptionStatus.value = SubscriptionStatus.UNKNOWN
            return
        }
        
        val purchasesResult = billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        ) { billingResult, purchasesList ->
            when (billingResult.responseCode) {
                BillingClient.BillingResponseCode.OK -> {
                    val activeSubscription = purchasesList.any { purchase ->
                        purchase.purchaseState == Purchase.PurchaseState.PURCHASED &&
                        !purchase.isAcknowledged &&
                        !purchase.isAutoRenewing
                    }
                    
                    _subscriptionStatus.value = if (activeSubscription) {
                        SubscriptionStatus.SUBSCRIBED
                    } else {
                        SubscriptionStatus.NOT_SUBSCRIBED
                    }
                }
                else -> {
                    _subscriptionStatus.value = SubscriptionStatus.UNKNOWN
                }
            }
        }
    }
    
    /**
     * Query available subscription products
     */
    fun querySubscriptionProducts() {
        if (!billingClient.isReady) {
            connectToBillingService()
            return
        }
        
        // List of subscription product IDs from Google Play Console
        val productIds = listOf(
            "premium_monthly",
            "premium_quarterly",
            "premium_yearly"
        )
        
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                productIds.map { productId ->
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                }
            )
            .build()
        
        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && !productDetailsList.isNullOrEmpty()) {
                val offers = productDetailsList.mapNotNull { productDetails ->
                    // Get the first subscription offer (you might want to handle multiple offers)
                    val subscriptionOffer = productDetails.subscriptionOfferDetails?.firstOrNull()
                    
                    subscriptionOffer?.let { offer ->
                        SubscriptionOffer(
                            id = productDetails.productId,
                            type = productDetails.productType,
                            price = offer.pricingPhases.pricingPhaseList.firstOrNull()?.formattedPrice ?: "",
                            priceAmountMicros = offer.pricingPhases.pricingPhaseList.firstOrNull()?.priceAmountMicros ?: 0,
                            title = productDetails.title,
                            description = productDetails.description,
                            subscriptionPeriod = offer.pricingPhases.pricingPhaseList.firstOrNull()?.billingPeriod ?: "",
                            freeTrialPeriod = offer.pricingPhases.pricingPhaseList.firstOrNull()?.billingPeriod
                        )
                    }
                }
                
                _availableSubscriptions.value = offers
            } else {
                Log.e(TAG, "Error querying products: ${billingResult.debugMessage}")
            }
        }
    }
    
    /**
     * Launch the billing flow for a subscription
     */
    fun launchBillingFlow(activity: Activity, productId: String) {
        if (!billingClient.isReady) {
            _purchaseFlowResult.value = PurchaseResult(false, "Billing service not ready")
            connectToBillingService()
            return
        }
        
        // Query product details first
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                )
            )
            .build()
        
        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && !productDetailsList.isNullOrEmpty()) {
                val productDetails = productDetailsList[0]
                val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken
                
                offerToken?.let { token ->
                    val flowParams = BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(
                            listOf(
                                BillingFlowParams.ProductDetailsParams.newBuilder()
                                    .setProductDetails(productDetails)
                                    .setOfferToken(token)
                                    .build()
                            )
                        )
                        .build()
                    
                    val responseCode = billingClient.launchBillingFlow(activity, flowParams).responseCode
                    
                    if (responseCode != BillingClient.BillingResponseCode.OK) {
                        _purchaseFlowResult.value = PurchaseResult(
                            false,
                            "Failed to launch billing flow. Error code: $responseCode"
                        )
                    }
                } ?: run {
                    _purchaseFlowResult.value = PurchaseResult(false, "No subscription offers available")
                }
            } else {
                _purchaseFlowResult.value = PurchaseResult(
                    false,
                    "Failed to get product details: ${billingResult.debugMessage}"
                )
            }
        }
    }
    
    /**
     * Clear the purchase result
     */
    fun clearPurchaseResult() {
        _purchaseFlowResult.value = null
    }
    
    // region BillingClientStateListener implementation
    
    override fun onBillingSetupFinished(billingResult: BillingResult) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            // Billing client is ready, query products and purchases
            querySubscriptionProducts()
            queryPurchases()
        } else {
            Log.e(TAG, "Billing setup failed: ${billingResult.debugMessage}")
            _subscriptionStatus.value = SubscriptionStatus.UNKNOWN
        }
    }
    
    override fun onBillingServiceDisconnected() {
        // Try to restart the connection on the next request
        Log.d(TAG, "Billing service disconnected")
        _subscriptionStatus.value = SubscriptionStatus.UNKNOWN
    }
    
    // endregion
    
    // region PurchasesUpdatedListener implementation
    
    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.let { processPurchases(it) }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                _purchaseFlowResult.value = PurchaseResult(false, "Purchase cancelled by user")
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                _purchaseFlowResult.value = PurchaseResult(false, "You already own this item")
            }
            else -> {
                _purchaseFlowResult.value = PurchaseResult(
                    false,
                    "Purchase failed: ${billingResult.debugMessage}"
                )
            }
        }
    }
    
    // endregion
    
    /**
     * Process successful purchases
     */
    private fun processPurchases(purchases: List<Purchase>) {
        var purchaseProcessed = false
        
        for (purchase in purchases) {
            if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED && !purchase.isAcknowledged) {
                // Acknowledge the purchase
                val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
                
                billingClient.acknowledgePurchase(acknowledgePurchaseParams) { billingResult ->
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        // Update subscription status
                        _subscriptionStatus.value = SubscriptionStatus.SUBSCRIBED
                        _purchaseFlowResult.value = PurchaseResult(
                            true,
                            "Subscription successful!",
                            purchase
                        )
                        purchaseProcessed = true
                    } else {
                        _purchaseFlowResult.value = PurchaseResult(
                            false,
                            "Failed to acknowledge purchase: ${billingResult.debugMessage}"
                        )
                    }
                }
            }
        }
        
        if (!purchaseProcessed) {
            _purchaseFlowResult.value = PurchaseResult(false, "No new purchases to process")
        }
    }
}
