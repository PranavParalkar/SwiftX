import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

/**
 * GET /api/kyc — fetch current user's KYC submission + status.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await adminClient
    .from('profiles')
    .select('kyc_status, full_name, email, phone')
    .eq('id', user.id)
    .single()

  const { data: submission } = await adminClient
    .from('kyc_submissions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    profile,
    submission,
    status: profile?.kyc_status ?? 'not_started',
  })
}

/**
 * POST /api/kyc — submit (or re-submit after rejection) KYC.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const required = [
    'date_of_birth', 'id_type', 'id_number',
    'address_line1', 'city', 'state', 'postal_code', 'country',
    'bank_account_number', 'bank_ifsc', 'bank_holder_name',
  ]
  for (const f of required) {
    if (!body[f] || String(body[f]).trim() === '') {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 })
    }
  }

  // Block if already verified
  const { data: profile } = await adminClient
    .from('profiles').select('kyc_status').eq('id', user.id).single()

  if (profile?.kyc_status === 'verified') {
    return NextResponse.json({ error: 'KYC already verified' }, { status: 400 })
  }
  if (profile?.kyc_status === 'pending') {
    return NextResponse.json({ error: 'KYC already under review' }, { status: 400 })
  }

  const payload = {
    user_id:             user.id,
    date_of_birth:       body.date_of_birth,
    gender:              body.gender ?? null,
    nationality:         body.nationality ?? 'IN',
    id_type:             body.id_type,
    id_number:           String(body.id_number).trim(),
    secondary_id_type:   body.secondary_id_type ?? null,
    secondary_id_number: body.secondary_id_number ? String(body.secondary_id_number).trim() : null,
    address_line1:       body.address_line1,
    address_line2:       body.address_line2 ?? null,
    city:                body.city,
    state:               body.state,
    postal_code:         body.postal_code,
    country:             body.country,
    bank_account_number: String(body.bank_account_number).trim(),
    bank_ifsc:           String(body.bank_ifsc).trim().toUpperCase(),
    bank_holder_name:    body.bank_holder_name,
    occupation:          body.occupation ?? null,
    source_of_funds:     body.source_of_funds ?? null,
    status:              'pending',
    submitted_at:        new Date().toISOString(),
    reviewed_at:         null,
    reviewed_by:         null,
    rejection_reason:    null,
  }

  // Upsert so a previously rejected user can resubmit cleanly.
  const { error: upErr } = await adminClient
    .from('kyc_submissions')
    .upsert(payload, { onConflict: 'user_id' })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // Move profile to pending
  await adminClient.from('profiles')
    .update({ kyc_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', user.id)

  // Tamper-evident ledger entry (PII redacted)
  await logEvent({
    eventType: 'kyc.submitted',
    actorId: user.id,
    entity: 'kyc_submissions',
    entityId: user.id,
    payload: {
      id_type: payload.id_type,
      id_number_last4: payload.id_number.slice(-4),
      bank_acct_last4: payload.bank_account_number.slice(-4),
      bank_ifsc: payload.bank_ifsc,
      country: payload.country,
    },
    req,
  })

  return NextResponse.json({ success: true, status: 'pending' })
}
