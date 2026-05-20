import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const data: Record<string, string> = {}
    body.forEach((value, key) => { data[key] = value.toString() })

    const refPayco = data.x_ref_payco
    const transactionId = data.x_transaction_id
    const amount = data.x_amount
    const codResponse = data.x_cod_response // 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida
    const reference = data.x_id_invoice || data.x_extra1
    const signature = data.x_signature

    // Verify signature
    const pCustId = process.env.EPAYCO_P_CUST_ID!
    const pKey = process.env.EPAYCO_P_KEY!
    const expectedSig = crypto
      .createHash('sha256')
      .update(`${pCustId}^${pKey}^${refPayco}^${transactionId}^${amount}^${codResponse}`)
      .digest('hex')

    if (signature !== expectedSig) {
      console.error('Invalid ePayco signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Only process accepted payments
    if (codResponse !== '1') {
      await supabase.from('payments').update({ 
        status: codResponse === '2' ? 'rejected' : codResponse === '3' ? 'pending' : 'failed',
        epayco_ref: refPayco,
        updated_at: new Date().toISOString()
      }).eq('reference', reference)
      return NextResponse.json({ ok: true })
    }

    // Get payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('reference', reference)
      .single()

    if (!payment) {
      console.error('Payment not found:', reference)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Calculate expiration
    const expires = new Date()
    if (payment.plan === 'monthly') {
      expires.setMonth(expires.getMonth() + 1)
    } else {
      expires.setFullYear(expires.getFullYear() + 1)
    }

    // Activate subscription
    await supabase.from('subscriptions').upsert({
      user_id: payment.user_id,
      module_id: payment.module_id,
      price_usd: payment.price_usd,
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expires.toISOString(),
      payment_ref: `EPAYCO_${refPayco}`
    }, { onConflict: 'user_id,module_id' })

    // Update payment status
    await supabase.from('payments').update({
      status: 'approved',
      epayco_ref: refPayco,
      updated_at: new Date().toISOString()
    }).eq('reference', reference)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ePayco also sends GET sometimes
export async function GET(req: NextRequest) {
  return POST(req)
}