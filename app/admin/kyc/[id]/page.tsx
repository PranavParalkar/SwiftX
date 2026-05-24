import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import KycReviewPanel from '@/components/KycReviewPanel'

export default async function AdminKycDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/dashboard')

  const { data: profile } = await adminClient
    .from('profiles').select('rm_id, full_name, email, phone, kyc_status, created_at')
    .eq('id', userId).single()
  if (!profile) notFound()

  const { data: sub } = await adminClient
    .from('kyc_submissions').select('*').eq('user_id', userId).maybeSingle()
  if (!sub) notFound()

  const reviewer = sub.reviewed_by
    ? (await adminClient.from('profiles').select('full_name, rm_id').eq('id', sub.reviewed_by).single()).data
    : null

  return (
    <div className="space-y-6">
      <Link href="/admin/kyc" className="text-xs font-semibold inline-flex items-center gap-1.5 hover:underline"
            style={{ color: 'var(--sx-primary)' }}>
        <ArrowLeft size={12} /> Back to queue
      </Link>

      <header>
        <p className="sx-h-eyebrow">KYC review</p>
        <h1 className="sx-h-title mt-2">{profile.full_name}</h1>
        <p className="sx-h-sub mt-1">
          <span className="font-mono">{profile.rm_id}</span> · {profile.email}
          {profile.phone ? ` · ${profile.phone}` : ''}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Submission details */}
        <div className="space-y-5">
          <Section title="Personal">
            <Row k="Date of birth"  v={sub.date_of_birth} />
            <Row k="Gender"         v={sub.gender || '—'} />
            <Row k="Nationality"    v={sub.nationality} />
            <Row k="Account opened" v={format(new Date(profile.created_at), 'dd MMM yyyy')} />
          </Section>

          <Section title="Identity">
            <Row k="Primary ID"   v={`${String(sub.id_type).toUpperCase()} · ${sub.id_number}`} mono />
            {sub.secondary_id_number && (
              <Row k="Secondary ID" v={`${String(sub.secondary_id_type).toUpperCase()} · ${sub.secondary_id_number}`} mono />
            )}
          </Section>

          <Section title="Address">
            <Row k="Line 1"  v={sub.address_line1} />
            {sub.address_line2 && <Row k="Line 2" v={sub.address_line2} />}
            <Row k="City"        v={sub.city} />
            <Row k="State"       v={sub.state} />
            <Row k="Postal code" v={sub.postal_code} mono />
            <Row k="Country"     v={sub.country} />
          </Section>

          <Section title="Bank">
            <Row k="Holder"        v={sub.bank_holder_name} />
            <Row k="Account"       v={sub.bank_account_number} mono />
            <Row k="IFSC / SWIFT"  v={sub.bank_ifsc} mono />
            {sub.occupation     && <Row k="Occupation"      v={sub.occupation} />}
            {sub.source_of_funds && <Row k="Source of funds" v={sub.source_of_funds} />}
          </Section>
        </div>

        {/* Decision panel */}
        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <div className="sx-card p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--sx-ink-3)' }}>Current status</p>
            <span className={`sx-pill ${
              sub.status === 'verified' ? 'sx-pill-mint'  :
              sub.status === 'rejected' ? 'sx-pill-coral' : 'sx-pill-amber'
            }`}>{sub.status}</span>

            <div className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--sx-ink-3)' }}>
              <div className="flex justify-between"><span>Submitted</span>      <span>{format(new Date(sub.submitted_at), 'dd MMM, HH:mm')}</span></div>
              {sub.reviewed_at && <div className="flex justify-between"><span>Reviewed</span> <span>{format(new Date(sub.reviewed_at), 'dd MMM, HH:mm')}</span></div>}
              {reviewer && <div className="flex justify-between"><span>Reviewer</span> <span className="font-mono">{reviewer.rm_id}</span></div>}
            </div>

            {sub.rejection_reason && (
              <div className="mt-4 rounded-xl p-3 text-xs"
                   style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)', color: '#9f1239' }}>
                <p className="font-bold mb-1">Last reviewer's note:</p>
                {sub.rejection_reason}
              </div>
            )}
          </div>

          <KycReviewPanel userId={userId} currentStatus={sub.status} />
        </aside>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sx-card p-5">
      <p className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--sx-ink-3)' }}>{title}</p>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0" style={{ color: 'var(--sx-ink-3)' }}>{k}</span>
      <span className={`font-semibold text-right ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--sx-ink)' }}>{v}</span>
    </div>
  )
}
