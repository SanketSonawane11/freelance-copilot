
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
    } else if (path.endsWith('/verify-payment')) {
      return handleVerifyPayment(req, supabase)
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

  const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_SECRET')}`)
  
  // Create or get customer
  let customerId;
  try {
    // Check if customer exists
    const customerResponse = await fetch(`https://api.razorpay.com/v1/customers?email=${encodeURIComponent(user.email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!customerResponse.ok) {
      throw new Error(`Customer fetch failed: ${customerResponse.status}`);
    }

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

      if (!newCustomerResponse.ok) {
        throw new Error(`Customer creation failed: ${newCustomerResponse.status}`);
      }

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

  // Create Razorpay order for checkout popup
  try {
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
        receipt: `r_${user_id.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user_id,
          plan: plan
        }
      })
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Order creation failed:', errorText);
      throw new Error(`Order creation failed: ${orderResponse.status}`);
    }

    const order = await orderResponse.json();
    console.log('Order created successfully:', order.id);

    return new Response(JSON.stringify({
      order_id: order.id,
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      amount: amount,
      plan: plan,
      currency: 'INR',
      customer: {
        name: user.email.split('@')[0],
        email: user.email
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create order',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
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

  // Handle payment captured
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity
    if (payment && payment.notes?.user_id && payment.notes?.plan) {
      console.log(`Processing payment for user ${payment.notes.user_id}, plan: ${payment.notes.plan}`)
      
      const userId = payment.notes.user_id
      const plan = payment.notes.plan
      
      // Calculate period end (30 days from now)
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      console.log(`Updating user ${userId} to plan ${plan} with period end: ${periodEnd}`)
      
      try {
        // Update billing_info
        const { error: billingError } = await supabase
          .from('billing_info')
          .upsert({
            user_id: userId,
            current_plan: plan,
            subscription_status: 'active',
            current_period_end: periodEnd,
            renewal_date: renewalDate,
            usage_proposals: 0,
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
        
        console.log(`✅ Successfully activated plan ${plan} for user ${userId}`)
        
      } catch (error) {
        console.error('❌ Database operation failed:', error)
        return new Response('Database error', { status: 500 })
      }
    }
  }

  return new Response('Webhook processed', { status: 200 })
}

async function handleVerifyPayment(req: Request, supabase: any) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, plan } = await req.json()
  
  console.log(`Verifying payment for user ${user_id}, plan: ${plan}`)

  // Get user's auth header for verification
  const authHeader = req.headers.get('Authorization')
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
  
  if (authError || !user || user.id !== user_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Verify payment signature
  const crypto = await import('node:crypto')
  const body = razorpay_order_id + "|" + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', Deno.env.get('RAZORPAY_SECRET') ?? '')
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    console.error('Invalid payment signature')
    return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Calculate period end (30 days from now)
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  
  console.log(`Payment verified, updating user ${user_id} to plan ${plan} with period end: ${periodEnd}`)
  
  try {
    // Update billing_info
    const { error: billingError } = await supabase
      .from('billing_info')
      .upsert({
        user_id: user_id,
        current_plan: plan,
        subscription_status: 'active',
        current_period_end: periodEnd,
        renewal_date: renewalDate,
        usage_proposals: 0,
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
      .eq('id', user_id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      throw profileError
    }

    // Reset current month usage in usage_stats
    const currentMonth = new Date().toISOString().substring(0, 7) + '-01'
    const { error: usageError } = await supabase
      .from('usage_stats')
      .upsert({
        user_id: user_id,
        month: currentMonth,
        proposals_used: 0,
        followups_used: 0,
        tokens_used: 0
      }, { onConflict: 'user_id,month' })

    if (usageError) {
      console.error('Usage stats reset error:', usageError)
    }
    
    console.log(`✅ Successfully activated plan ${plan} for user ${user_id}`)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Database operation failed:', error)
    return new Response(JSON.stringify({ error: 'Database update failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
