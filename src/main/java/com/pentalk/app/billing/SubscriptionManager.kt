package com.pentalk.app.billing

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.pentalk.app.BuildConfig
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages subscription state and provides utility methods for subscription-related functionality.
 */
@Singleton
class SubscriptionManager @Inject constructor(
    private val context: Context,
    private val billingManager: BillingManager
) {
    private val prefs: SharedPreferences = context.getSharedPreferences("subscription_prefs", Context.MODE_PRIVATE)
    
    companion object {
        private const val PREF_IS_PREMIUM = "is_premium"
        private const val PREF_SUBSCRIPTION_EXPIRY = "subscription_expiry"
        private const val PREF_TRIAL_ACTIVATED = "trial_activated"
        private const val PREF_LAST_POPUP_SHOWN = "last_popup_shown"
        private const val POPUP_COOLDOWN_DAYS = 7L
    }
    
    /**
     * Check if the user has an active premium subscription
     */
    suspend fun isPremiumActive(): Boolean {
        // In a real app, you would check with the billing manager
        // For now, we'll use a simple check against expiry
        val expiryTime = prefs.getLong(PREF_SUBSCRIPTION_EXPIRY, 0)
        return expiryTime > System.currentTimeMillis()
    }
    
    /**
     * Check if the user is eligible for a free trial
     */
    fun isEligibleForTrial(): Boolean {
        return !prefs.getBoolean(PREF_TRIAL_ACTIVATED, false)
    }
    
    /**
     * Activate the free trial
     * @param days Number of days for the trial period (default: 7 days)
     */
    fun activateTrial(days: Int = 7) {
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_YEAR, days)
        
        prefs.edit {
            putBoolean(PREF_TRIAL_ACTIVATED, true)
            putLong(PREF_SUBSCRIPTION_EXPIRY, calendar.timeInMillis)
            apply()
        }
    }
    
    /**
     * Check if the premium popup should be shown
     * Respects the cooldown period between popups
     */
    fun shouldShowPremiumPopup(): Boolean {
        if (isPremiumActive()) return false
        
        val lastShown = prefs.getLong(PREF_LAST_POPUP_SHOWN, 0)
        val now = System.currentTimeMillis()
        val daysSinceLastShown = (now - lastShown) / (1000 * 60 * 60 * 24)
        
        return daysSinceLastShown >= POPUP_COOLDOWN_DAYS
    }
    
    /**
     * Record that the premium popup was shown
     */
    fun recordPopupShown() {
        prefs.edit {
            putLong(PREF_LAST_POPUP_SHOWN, System.currentTimeMillis())
            apply()
        }
    }
    
    /**
     * Get the number of days remaining in the trial period
     * @return Number of days remaining, or null if not in trial
     */
    fun getTrialDaysRemaining(): Int? {
        val expiry = prefs.getLong(PREF_SUBSCRIPTION_EXPIRY, 0)
        if (expiry == 0L) return null
        
        val now = System.currentTimeMillis()
        if (now > expiry) return 0
        
        return ((expiry - now) / (1000 * 60 * 60 * 24)).toInt() + 1 // Add 1 to round up
    }
    
    /**
     * Get the subscription expiry date
     * @return The expiry date as a Date object, or null if not subscribed
     */
    fun getSubscriptionExpiryDate(): Date? {
        val expiry = prefs.getLong(PREF_SUBSCRIPTION_EXPIRY, 0)
        return if (expiry > 0) Date(expiry) else null
    }
    
    /**
     * Check if the current build is a debug build
     */
    fun isDebugBuild(): Boolean {
        return BuildConfig.DEBUG
    }
    
    /**
     * Get the subscription status as a human-readable string
     */
    fun getSubscriptionStatusString(): String {
        return if (isPremiumActive()) {
            "Premium"
        } else {
            "Free"
        }
    }
    
    /**
     * Handle successful subscription purchase
     */
    fun handleSuccessfulPurchase(purchase: Purchase) {
        // In a real app, you would verify the purchase with your server
        // and update the subscription expiry date
        val calendar = Calendar.getInstance()
        when (purchase.products.firstOrNull()) {
            "premium_monthly" -> calendar.add(Calendar.MONTH, 1)
            "premium_quarterly" -> calendar.add(Calendar.MONTH, 3)
            "premium_yearly" -> calendar.add(Calendar.YEAR, 1)
        }
        
        prefs.edit {
            putLong(PREF_SUBSCRIPTION_EXPIRY, calendar.timeInMillis)
            apply()
        }
    }
}
