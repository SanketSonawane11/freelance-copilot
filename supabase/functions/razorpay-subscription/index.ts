
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname

    if (path.endsWith('/webhook')) {
      return handleWebhook(req, supabase)
    } else if (path.endsWith('/create-subscription')) {
      return handleCreateSubscription(req, supabase)
    } else if (path.endsWith('/cancel-subscription')) {
      return handleCancelSubscription(req, supabase)
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleCreateSubscription(req: Request, supabase: any) {
  const { user_id, plan } = await req.json()
  
  console.log(`Creating subscription for user ${user_id} with plan ${plan}`)

  // Get user's auth header for verification
  const authHeader = req.headers.get('Authorization')
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
  
  if (authError || !user || user.id !== user_id) {
    console.log('Authorization failed:', authError?.message || 'User mismatch')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Plan amounts (in paise - INR smallest unit)
  const planAmounts = {
    basic: 14900, // ₹149
    pro: 34900    // ₹349
  }

  const amount = planAmounts[plan as keyof typeof planAmounts]
  if (!amount) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create Razorpay subscription instead of one-time order
  const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_SECRET')}`)
  
  // First, create or get customer
  let customerId;
  try {
    // Check if customer exists
    const customerResponse = await fetch(`https://api.razorpay.com/v1/customers?email=${user.email}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json'
      }
    });

    const customerData = await customerResponse.json();
    
    if (customerData.items && customerData.items.length > 0) {
      customerId = customerData.items[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      // Create new customer
      const newCustomerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${razorpayAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.email.split('@')[0],
          email: user.email,
          contact: '',
        })
      });

      const newCustomer = await newCustomerResponse.json();
      customerId = newCustomer.id;
      console.log('Created new customer:', customerId);
    }
  } catch (error) {
    console.error('Customer creation/fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create subscription plan if it doesn't exist
  const planId = `${plan}_monthly_${amount}`;
  try {
    const planResponse = await fetch('https://api.razorpay.com/v1/plans', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        period: 'monthly',
        interval: 1,
        item: {
          name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          amount: amount,
          currency: 'INR'
        },
        id: planId
      })
    });

    if (!planResponse.ok && planResponse.status !== 400) { // 400 means plan already exists
      throw new Error('Failed to create plan');
    }
  } catch (error) {
    console.log('Plan creation error (might already exist):', error);
  }

  // Create subscription
  const subscriptionData = {
    plan_id: planId,
    customer_id: customerId,
    quantity: 1,
    total_count: 12, // 12 months
    notes: {
      user_id: user_id,
      plan: plan
    },
    notify: 1
  };

  console.log('Creating Razorpay subscription with data:', JSON.stringify(subscriptionData, null, 2));

  const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscriptionData)
  });

  const responseText = await subscriptionResponse.text();
  console.log(`Razorpay subscription API response status: ${subscriptionResponse.status}`);
  console.log('Razorpay subscription API response:', responseText);

  if (!subscriptionResponse.ok) {
    console.error('Razorpay subscription API error:', responseText);
    return new Response(JSON.stringify({ 
      error: 'Failed to create subscription',
      details: responseText,
      status: subscriptionResponse.status
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let subscription;
  try {
    subscription = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse Razorpay subscription response:', parseError);
    return new Response(JSON.stringify({ 
      error: 'Invalid response from payment gateway',
      details: responseText
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log('Subscription created successfully:', subscription.id);
  return new Response(JSON.stringify({
    subscription_id: subscription.id,
    key_id: Deno.env.get('RAZORPAY_KEY_ID'),
    amount: amount,
    plan: plan,
    currency: 'INR',
    short_url: subscription.short_url
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleCancelSubscription(req: Request, supabase: any) {
  const { user_id } = await req.json()
  
  console.log(`Cancelling subscription for user ${user_id}`)

  // Get user's auth header for verification
  const authHeader = req.headers.get('Authorization')
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
  
  if (authError || !user || user.id !== user_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Get current subscription
  const { data: billingInfo } = await supabase
    .from('billing_info')
    .select('razorpay_subscription_id')
    .eq('user_id', user_id)
    .single()

  if (billingInfo?.razorpay_subscription_id) {
    // Cancel Razorpay subscription
    const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_SECRET')}`)
    
    try {
      await fetch(`https://api.razorpay.com/v1/subscriptions/${billingInfo.razorpay_subscription_id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${razorpayAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancel_at_cycle_end: 1 })
      });
    } catch (error) {
      console.error('Failed to cancel Razorpay subscription:', error);
    }
  }

  // Update both billing_info and user_profiles to downgrade to starter
  const { error: billingError } = await supabase
    .from('billing_info')
    .update({
      current_plan: 'starter',
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user_id)

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'starter'
    })
    .eq('id', user_id)

  if (billingError || profileError) {
    console.error('Database update error:', billingError || profileError)
    return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleWebhook(req: Request, supabase: any) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature) {
    console.error('Missing webhook signature')
    return new Response('Missing signature', { status: 400 })
  }

  // Verify webhook signature
  const crypto = await import('node:crypto')
  const expectedSignature = crypto
    .createHmac('sha256', Deno.env.get('RAZORPAY_SECRET') ?? '')
    .update(body)
    .digest('hex')

  if (expectedSignature !== signature) {
    console.error('Invalid webhook signature')
    return new Response('Invalid signature', { status: 403 })
  }

  const event = JSON.parse(body)
  console.log('Razorpay webhook received:', event.event)
  console.log('Full event payload:', JSON.stringify(event, null, 2))

  // Handle subscription activation
  if (event.event === 'subscription.activated') {
    const subscription = event.payload?.subscription?.entity
    if (subscription && subscription.notes?.user_id && subscription.notes?.plan) {
      console.log(`Processing subscription activation for user ${subscription.notes.user_id}, plan: ${subscription.notes.plan}`)
      
      const userId = subscription.notes.user_id
      const plan = subscription.notes.plan
      
      // Calculate period end (30 days from now for monthly subscription)
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      console.log(`Updating user ${userId} to plan ${plan} with period end: ${periodEnd}`)
      
      try {
        // Update billing_info with full subscription details
        const { error: billingError } = await supabase
          .from('billing_info')
          .upsert({
            user_id: userId,
            current_plan: plan,
            subscription_status: 'active',
            current_period_end: periodEnd,
            renewal_date: renewalDate,
            razorpay_customer_id: subscription.customer_id,
            razorpay_subscription_id: subscription.id,
            usage_proposals: 0, // Reset usage on new subscription
            usage_followups: 0,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (billingError) {
          console.error('Billing update error:', billingError)
          throw billingError
        }
        
        // Update user_profiles
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            subscription_tier: plan
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Profile update error:', profileError)
          throw profileError
        }

        // Reset current month usage in usage_stats
        const currentMonth = new Date().toISOString().substring(0, 7) + '-01'
        const { error: usageError } = await supabase
          .from('usage_stats')
          .upsert({
            user_id: userId,
            month: currentMonth,
            proposals_used: 0,
            followups_used: 0,
            tokens_used: 0
          }, { onConflict: 'user_id,month' })

        if (usageError) {
          console.error('Usage stats reset error:', usageError)
        }
        
        console.log(`✅ Successfully activated subscription for user ${userId} to plan: ${plan}`)
        
      } catch (error) {
        console.error('❌ Database operation failed:', error)
        return new Response('Database error', { status: 500 })
      }
    }
  }

  // Handle subscription charged (monthly renewal)
  if (event.event === 'subscription.charged') {
    const payment = event.payload?.payment?.entity
    const subscription = event.payload?.subscription?.entity
    
    if (payment && subscription && subscription.notes?.user_id) {
      console.log(`Processing subscription renewal for user ${subscription.notes.user_id}`)
      
      const userId = subscription.notes.user_id
      const plan = subscription.notes.plan || 'basic'
      
      // Calculate next period end
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      try {
        // Update billing info with new period
        const { error: billingError } = await supabase
          .from('billing_info')
          .update({
            current_period_end: periodEnd,
            renewal_date: renewalDate,
            subscription_status: 'active',
            usage_proposals: 0, // Reset monthly usage
            usage_followups: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (billingError) {
          console.error('Billing renewal update error:', billingError)
          throw billingError
        }

        // Reset current month usage in usage_stats
        const currentMonth = new Date().toISOString().substring(0, 7) + '-01'
        const { error: usageError } = await supabase
          .from('usage_stats')
          .upsert({
            user_id: userId,
            month: currentMonth,
            proposals_used: 0,
            followups_used: 0,
            tokens_used: 0
          }, { onConflict: 'user_id,month' })

        if (usageError) {
          console.error('Usage stats reset error:', usageError)
        }
        
        console.log(`✅ Successfully renewed subscription for user ${userId}`)
        
      } catch (error) {
        console.error('❌ Subscription renewal failed:', error)
        return new Response('Database error', { status: 500 })
      }
    }
  }

  // Handle subscription cancelled
  if (event.event === 'subscription.cancelled') {
    const subscription = event.payload?.subscription?.entity
    if (subscription && subscription.notes?.user_id) {
      const userId = subscription.notes.user_id
      
      console.log(`Processing subscription cancellation for user ${userId}`)
      
      try {
        // Update to starter plan
        const { error: billingError } = await supabase
          .from('billing_info')
          .update({
            current_plan: 'starter',
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            subscription_tier: 'starter'
          })
          .eq('id', userId)

        if (billingError || profileError) {
          console.error('Cancellation update error:', billingError || profileError)
          throw billingError || profileError
        }
        
        console.log(`✅ Successfully cancelled subscription for user ${userId}`)
        
      } catch (error) {
        console.error('❌ Subscription cancellation failed:', error)
        return new Response('Database error', { status: 500 })
      }
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
