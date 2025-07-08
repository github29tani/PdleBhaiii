package com.pentalk.app.ui.screens.subscription

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.pentalk.app.R
import com.pentalk.app.billing.model.SubscriptionPlan
import com.pentalk.app.ui.components.subscription.PremiumBadge
import com.pentalk.app.ui.components.subscription.SubscriptionPlanItem
import com.pentalk.app.ui.theme.*
import com.pentalk.app.ui.viewmodel.subscription.SubscriptionViewModel

@Composable
fun SubscriptionScreen(
    onBackClick: () -> Unit,
    viewModel: SubscriptionViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    
    // Mock subscription plans - in a real app, these would come from your ViewModel
    val subscriptionPlans = remember { SubscriptionPlan.getMockPlans() }
    
    // State for selected plan
    var selectedPlan by remember { mutableStateOf<SubscriptionPlan?>(null) }
    
    // Handle purchase result
    LaunchedEffect(Unit) {
        // In a real app, you would collect purchase results from the ViewModel
        // and show appropriate UI feedback
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Header
        TopAppBar(
            title = { 
                Text(
                    text = "Go Premium",
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                ) 
            },
            navigationIcon = {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.White
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Black,
                actionIconContentColor = Color.White
            )
        )
        
        // Content
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            // Premium badge
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                PremiumBadge()
            }
            
            // Title
            Text(
                text = "Upgrade to Premium",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Subtitle
            Text(
                text = "Unlock all premium features and enjoy an ad-free experience",
                color = Color.Gray,
                fontSize = 16.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Features list
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(vertical = 16.dp)
            ) {
                FeatureItem(
                    icon = Icons.Default.Star,
                    title = "Ad-free experience",
                    description = "Enjoy using the app without any advertisements"
                )
                
                FeatureItem(
                    icon = Icons.Default.Star,
                    title = "Unlimited notes",
                    description = "Create and save unlimited notes and documents"
                )
                
                FeatureItem(
                    icon = Icons.Default.Star,
                    title = "Priority support",
                    description = "Get faster responses from our support team"
                )
                
                FeatureItem(
                    icon = Icons.Default.Star,
                    title = "Exclusive content",
                    description = "Access to premium templates and study materials"
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Subscription plans
            Text(
                text = "Choose your plan",
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            // Subscription options
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(bottom = 24.dp)
            ) {
                subscriptionPlans.forEach { plan ->
                    val isSelected = selectedPlan?.id == plan.id
                    SubscriptionPlanItem(
                        plan = plan,
                        isSelected = isSelected,
                        onClick = {
                            selectedPlan = if (isSelected) null else plan
                            // In a real app, you would trigger the purchase flow here
                            // viewModel.purchaseSubscription(plan.id)
                        }
                    )
                }
            }
            
            // Terms and privacy
            Text(
                text = buildAnnotatedString {
                    append("By continuing, you agree to our ")
                    withStyle(style = SpanStyle(color = BrightBlue)) {
                        append("Terms of Service")
                    }
                    append(" and ")
                    withStyle(style = SpanStyle(color = BrightBlue)) {
                        append("Privacy Policy")
                    }
                    append(". Subscription will automatically renew unless canceled at least 24 hours before the end of the current period. You can manage your subscription in your Google Play account settings.")
                },
                color = Color.Gray,
                fontSize = 12.sp,
                lineHeight = 16.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            // Restore purchases button
            TextButton(
                onClick = { /* Handle restore purchases */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                Text(
                    text = "Restore Purchases",
                    color = BrightBlue,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
private fun FeatureItem(
    icon: Any,
    title: String,
    description: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Icon
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(BrightBlue.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = BrightBlue,
                modifier = Modifier.size(20.dp)
            )
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        // Text content
        Column {
            Text(
                text = title,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
            
            Text(
                text = description,
                color = Color.Gray,
                fontSize = 14.sp,
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
fun SubscriptionSuccessDialog(
    onDismiss: () -> Unit,
    onContinue: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Subscription Successful!",
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Text(
                text = "Thank you for subscribing to StudySphere Premium. Your subscription is now active. Enjoy all the premium features!",
                color = Color.White.copy(alpha = 0.8f)
            )
        },
        confirmButton = {
            Button(
                onClick = onContinue,
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrightBlue,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Continue")
            }
        },
        containerColor = Color(0xFF1A1A2E),
        titleContentColor = Color.White,
        textContentColor = Color.White
    )
}
