
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

  // Create Razorpay subscription
  const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_SECRET')}`)
  
  // Updated plan amounts (in paise - INR smallest unit)
  const planAmounts = {
    basic: 14900, // ₹149
    pro: 34900    // ₹349
  }

  const subscriptionData = {
    plan_id: plan === 'pro' ? 'plan_pro_monthly' : 'plan_basic_monthly',
    customer_notify: 1,
    total_count: 12, // 12 months
    notes: {
      user_id: user_id,
      plan: plan
    }
  }

  console.log('Sending request to Razorpay with data:', JSON.stringify(subscriptionData, null, 2))

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscriptionData)
  })

  const responseText = await razorpayResponse.text()
  console.log(`Razorpay API response status: ${razorpayResponse.status}`)
  console.log('Razorpay API response:', responseText)

  if (!razorpayResponse.ok) {
    console.error('Razorpay API error:', responseText)
    return new Response(JSON.stringify({ 
      error: 'Failed to create subscription',
      details: responseText,
      status: razorpayResponse.status
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let subscription
  try {
    subscription = JSON.parse(responseText)
  } catch (parseError) {
    console.error('Failed to parse Razorpay response:', parseError)
    return new Response(JSON.stringify({ 
      error: 'Invalid response from payment gateway',
      details: responseText
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  // Update billing_info with new subscription
  const { error: updateError } = await supabase
    .from('billing_info')
    .upsert({
      user_id: user_id,
      current_plan: plan,
      razorpay_subscription_id: subscription.id,
      subscription_status: 'created',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      updated_at: new Date().toISOString()
    })

  if (updateError) {
    console.error('Database update error:', updateError)
  }

  console.log('Subscription created successfully:', subscription.id)
  return new Response(JSON.stringify({
    subscription_id: subscription.id,
    key_id: Deno.env.get('RAZORPAY_KEY_ID'),
    amount: planAmounts[plan as keyof typeof planAmounts],
    plan: plan
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
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
  const { data: billing, error: billingError } = await supabase
    .from('billing_info')
    .select('razorpay_subscription_id')
    .eq('user_id', user_id)
    .single()

  if (billingError || !billing?.razorpay_subscription_id) {
    return new Response(JSON.stringify({ error: 'No active subscription found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Cancel Razorpay subscription
  const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_SECRET')}`)
  
  const cancelResponse = await fetch(`https://api.razorpay.com/v1/subscriptions/${billing.razorpay_subscription_id}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json'
    }
  })

  if (!cancelResponse.ok) {
    const errorText = await cancelResponse.text()
    console.error('Razorpay cancel error:', errorText)
    return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update billing_info
  const { error: updateError } = await supabase
    .from('billing_info')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user_id)

  if (updateError) {
    console.error('Database update error:', updateError)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleWebhook(req: Request, supabase: any) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature) {
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

  const subscription = event.payload?.subscription?.entity
  if (!subscription) {
    return new Response('No subscription data', { status: 400 })
  }

  let newStatus = 'inactive'
  switch (event.event) {
    case 'subscription.charged':
      newStatus = 'active'
      break
    case 'subscription.cancelled':
    case 'subscription.completed':
      newStatus = 'cancelled'
      break
    case 'payment.failed':
      newStatus = 'expired'
      break
  }

  // Update billing_info based on subscription_id
  const { error: updateError } = await supabase
    .from('billing_info')
    .update({
      subscription_status: newStatus,
      current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id)

  if (updateError) {
    console.error('Webhook database update error:', updateError)
    return new Response('Database error', { status: 500 })
  }

  console.log(`Updated subscription ${subscription.id} to status: ${newStatus}`)
  return new Response('Webhook processed', { status: 200 })
}
