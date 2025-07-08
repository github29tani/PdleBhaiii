package com.pentalk.app.billing.model

import androidx.compose.ui.graphics.Color
import com.pentalk.app.ui.theme.Purple40

/**
 * Data class representing a subscription plan
 */
data class SubscriptionPlan(
    val id: String,
    val title: String,
    val price: String,
    val description: String,
    val features: List<String>,
    val isPopular: Boolean = false,
    val popularLabel: String = "MOST POPULAR",
    val buttonText: String = "Get Started",
    val buttonColor: Color = Purple40
) {
    companion object {
        fun getMockPlans(): List<SubscriptionPlan> = listOf(
            SubscriptionPlan(
                id = "premium_monthly",
                title = "Monthly",
                price = "₹49",
                description = "per month",
                features = listOf(
                    "✓ All premium features",
                    "✓ Ad-free experience",
                    "✓ Priority support"
                )
            ),
            SubscriptionPlan(
                id = "premium_quarterly",
                title = "Quarterly",
                price = "₹129",
                description = "per 3 months (Save 12%)",
                features = listOf(
                    "✓ All premium features",
                    "✓ Ad-free experience",
                    "✓ Priority support"
                ),
                isPopular = true
            ),
            SubscriptionPlan(
                id = "premium_yearly",
                title = "Yearly",
                price = "₹349",
                description = "per year (Save 40%)",
                features = listOf(
                    "✓ All premium features",
                    "✓ Ad-free experience",
                    "✓ Priority support",
                    "✓ Exclusive content"
                )
            )
        )
    }
}
