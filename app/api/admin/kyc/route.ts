import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const { data: profile } = await adminClient
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 as const }
  return { user, profile }
}

/**
 * GET /api/admin/kyc — list KYC submissions, newest first.
 * Optional ?status=pending|verified|rejected
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')

  let q = adminClient
    .from('kyc_submissions')
    .select('*, profile:profiles!kyc_submissions_user_id_fkey(rm_id, full_name, email, phone)')
    .order('submitted_at', { ascending: false })
    .limit(100)

  if (status === 'pending' || status === 'verified' || status === 'rejected') {
    q = q.eq('status', status)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ submissions: data ?? [] })
}

/**
 * PATCH /api/admin/kyc — approve or reject a submission.
 * Body: { user_id, action: 'approve'|'reject', rejection_reason? }
 */
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin()
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { user_id, action, rejection_reason } = await req.json()
  if (!user_id || !action) {
    return NextResponse.json({ error: 'Missing user_id or action' }, { status: 400 })
  }
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (action === 'reject' && (!rejection_reason || !rejection_reason.trim())) {
    return NextResponse.json({ error: 'rejection_reason is required when rejecting' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'verified' : 'rejected'
  const now = new Date().toISOString()

  // Update submission
  const { error: subErr } = await adminClient
    .from('kyc_submissions')
    .update({
      status: newStatus,
      reviewed_at: now,
      reviewed_by: gate.user!.id,
      rejection_reason: action === 'reject' ? rejection_reason : null,
    })
    .eq('user_id', user_id)
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 400 })

  // Update profile mirror
  await adminClient.from('profiles')
    .update({ kyc_status: newStatus, updated_at: now })
    .eq('id', user_id)

  await logEvent({
    eventType: action === 'approve' ? 'kyc.approved' : 'kyc.rejected',
    actorId: gate.user!.id,
    entity: 'kyc_submissions',
    entityId: user_id,
    payload: {
      target_user: user_id,
      decision: newStatus,
      reason: action === 'reject' ? rejection_reason : null,
    },
    req,
  })

  return NextResponse.json({ success: true, status: newStatus })
}
