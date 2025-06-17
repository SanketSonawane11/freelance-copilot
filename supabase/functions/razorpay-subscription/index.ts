
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

  // Create Razorpay order (not subscription) for one-time payment
  const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_SECRET')}`)
  
  const orderData = {
    amount: amount, // amount in paise
    currency: 'INR',
    receipt: `receipt_${user_id}_${Date.now()}`,
    notes: {
      user_id: user_id,
      plan: plan
    }
  }

  console.log('Creating Razorpay order with data:', JSON.stringify(orderData, null, 2))

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  })

  const responseText = await razorpayResponse.text()
  console.log(`Razorpay API response status: ${razorpayResponse.status}`)
  console.log('Razorpay API response:', responseText)

  if (!razorpayResponse.ok) {
    console.error('Razorpay API error:', responseText)
    return new Response(JSON.stringify({ 
      error: 'Failed to create payment order',
      details: responseText,
      status: razorpayResponse.status
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let order
  try {
    order = JSON.parse(responseText)
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
  
  // Update billing_info with pending order
  const { error: updateError } = await supabase
    .from('billing_info')
    .upsert({
      user_id: user_id,
      current_plan: 'starter', // Keep starter until payment is confirmed
      subscription_status: 'pending',
      updated_at: new Date().toISOString()
    })

  if (updateError) {
    console.error('Database update error:', updateError)
  }

  console.log('Order created successfully:', order.id)
  return new Response(JSON.stringify({
    order_id: order.id,
    key_id: Deno.env.get('RAZORPAY_KEY_ID'),
    amount: amount,
    plan: plan,
    currency: 'INR'
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

  // Update billing_info to downgrade to starter
  const { error: updateError } = await supabase
    .from('billing_info')
    .update({
      current_plan: 'starter',
      subscription_status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user_id)

  if (updateError) {
    console.error('Database update error:', updateError)
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

  // Handle payment success
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity
    if (payment && payment.notes?.user_id && payment.notes?.plan) {
      const { error: updateError } = await supabase
        .from('billing_info')
        .update({
          current_plan: payment.notes.plan,
          subscription_status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString()
        })
        .eq('user_id', payment.notes.user_id)

      if (updateError) {
        console.error('Webhook database update error:', updateError)
        return new Response('Database error', { status: 500 })
      }

      console.log(`Updated user ${payment.notes.user_id} to plan: ${payment.notes.plan}`)
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
