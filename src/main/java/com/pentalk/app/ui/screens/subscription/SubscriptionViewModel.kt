package com.pentalk.app.ui.screens.subscription

import android.app.Application
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pentalk.app.billing.BillingManager
import com.pentalk.app.billing.PurchaseResult
import com.pentalk.app.billing.SubscriptionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class SubscriptionViewModel(application: Application) : AndroidViewModel(application) {
    private val billingManager = BillingManager(application)
    
    private val _uiState = MutableStateFlow<SubscriptionUiState>(SubscriptionUiState.Loading)
    val uiState: StateFlow<SubscriptionUiState> = _uiState
    
    private val _purchaseResult = MutableStateFlow<PurchaseResult?>(null)
    val purchaseResult: StateFlow<PurchaseResult?> = _purchaseResult
    
    init {
        viewModelScope.launch {
            // Collect subscription status updates
            billingManager.subscriptionStatus.collectLatest { status ->
                _uiState.value = when (status) {
                    is SubscriptionStatus.Unknown -> SubscriptionUiState.Loading
                    is SubscriptionStatus.NotSubscribed -> {
                        // Load available subscriptions when not subscribed
                        loadAvailableSubscriptions()
                        SubscriptionUiState.NotSubscribed
                    }
                    is SubscriptionStatus.Subscribed -> {
                        SubscriptionUiState.Subscribed(
                            subscriptionType = status.subscriptionType,
                            expiryTime = status.expiryTime
                        )
                    }
                }
            }
        }
        
        viewModelScope.launch {
            // Collect purchase results
            billingManager.purchaseFlowResult.collectLatest { result ->
                _purchaseResult.value = result
                // Refresh subscription status after purchase
                if (result is PurchaseResult.Success) {
                    billingManager.refreshSubscriptionStatus()
                }
            }
        }
    }
    
    private fun loadAvailableSubscriptions() {
        viewModelScope.launch {
            billingManager.availableSubscriptions.collect { subscriptions ->
                if (subscriptions.isNotEmpty()) {
                    _uiState.value = SubscriptionUiState.NotSubscribed(subscriptions)
                }
            }
        }
    }
    
    fun purchaseSubscription(activity: android.app.Activity, productId: String) {
        billingManager.launchBillingFlow(activity, productId)
    }
    
    fun clearPurchaseResult() {
        _purchaseResult.value = null
        billingManager.clearPurchaseResult()
    }
    
    fun refreshSubscriptionStatus() {
        billingManager.refreshSubscriptionStatus()
    }
}

sealed class SubscriptionUiState {
    object Loading : SubscriptionUiState()
    object NotSubscribed : SubscriptionUiState()
    data class Subscribed(
        val subscriptionType: String,
        val expiryTime: Long
    ) : SubscriptionUiState()
    
    data class NotSubscribed(
        val availableSubscriptions: List<com.pentalk.app.billing.SubscriptionOffer> = emptyList()
    ) : SubscriptionUiState()
}
