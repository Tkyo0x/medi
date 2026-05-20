import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { module_id, plan } = await req.json()
  if (!module_id || !plan) return NextResponse.json({ error: 'module_id and plan required' }, { status: 400 })

  // Get pricing from config
  const { data: cfgData } = await supabase.from('app_config').select('*')
  const cfg: Record<string, string> = {}
  ;(cfgData || []).forEach((r: any) => { cfg[r.key] = r.value })

  const isMonthly = plan === 'monthly'
  const priceUSD = parseFloat(isMonthly ? (cfg.monthly_price || '3') : (cfg.annual_price || '20'))
  
  // Convert USD to COP (approximate rate)
  const usdToCop = 4200
  const priceCOP = Math.round(priceUSD * usdToCop)

  // Create unique reference
  const ref = `MC-${userId.slice(-8)}-${module_id}-${Date.now()}`

  // Store pending payment in Supabase
  await supabase.from('payments').upsert({
    reference: ref,
    user_id: userId,
    module_id,
    plan,
    price_usd: priceUSD,
    price_cop: priceCOP,
    status: 'pending',
    created_at: new Date().toISOString()
  }, { onConflict: 'reference' })

  // Generate ePayco integrity signature
  const pCustId = process.env.EPAYCO_P_CUST_ID!
  const pKey = process.env.EPAYCO_P_KEY!
  const isTest = process.env.EPAYCO_TEST === 'true'

  const signature = crypto
    .createHash('sha256')
    .update(`${pCustId}^${pKey}^${ref}^${priceCOP}^COP`)
    .digest('hex')

  return NextResponse.json({
    publicKey: process.env.EPAYCO_PUBLIC_KEY,
    reference: ref,
    amount: priceCOP,
    currency: 'COP',
    description: `MediCore ${isMonthly ? 'Mensual' : 'Anual'} — ${module_id}`,
    tax: 0,
    taxBase: priceCOP,
    signature,
    test: isTest,
    plan,
    priceUSD,
    responseUrl: 'https://www.getmedicore.com/api/payments/response',
    confirmationUrl: 'https://www.getmedicore.com/api/payments/confirm',
  })
}