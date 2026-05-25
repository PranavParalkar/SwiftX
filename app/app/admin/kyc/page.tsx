import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ShieldCheck, Clock, AlertOctagon, CheckCircle2 } from 'lucide-react'

const STATUS_PILL: Record<string, string> = {
  pending:  'sx-pill-amber',
  verified: 'sx-pill-mint',
  rejected: 'sx-pill-coral',
}

export default async function AdminKycListPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/dashboard')

  const sp = await searchParams
  const filter = (sp?.status ?? 'pending') as 'pending'|'verified'|'rejected'|'all'

  let q = adminClient
    .from('kyc_submissions')
    .select('id, user_id, status, submitted_at, country, id_type, profile:profiles!kyc_submissions_user_id_fkey(rm_id, full_name, email)')
    .order('submitted_at', { ascending: false })
    .limit(100)
  if (filter !== 'all') q = q.eq('status', filter)
  const { data: subs } = await q

  // Counts for the filter chips
  const { count: pendingCount }  = await adminClient.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  const { count: verifiedCount } = await adminClient.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'verified')
  const { count: rejectedCount } = await adminClient.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'rejected')

  return (
    <div className="space-y-6">
      <header>
        <p className="sx-h-eyebrow"><ShieldCheck size={12} className="inline -mt-0.5 mr-1" /> Compliance</p>
        <h1 className="sx-h-title mt-2">KYC review queue</h1>
        <p className="sx-h-sub mt-1">Approve or reject member onboarding submissions.</p>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pending"  value={pendingCount  ?? 0} icon={Clock}        accent="linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)" />
        <StatCard label="Verified" value={verifiedCount ?? 0} icon={CheckCircle2} accent="linear-gradient(135deg, #10b981 0%, #34d399 100%)" />
        <StatCard label="Rejected" value={rejectedCount ?? 0} icon={AlertOctagon} accent="linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'verified', 'rejected', 'all'] as const).map(s => {
          const active = filter === s
          return (
            <Link key={s} href={`/admin/kyc${s === 'all' ? '' : `?status=${s}`}`}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-full border transition"
                  style={{
                    borderColor: active ? 'transparent' : 'var(--sx-line)',
                    background:  active ? 'var(--sx-primary)' : 'var(--sx-panel)',
                    color:       active ? '#fff' : 'var(--sx-ink-2)',
                  }}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          )
        })}
      </div>

      {/* Queue list */}
      <div className="sx-card overflow-hidden">
        {!subs?.length ? (
          <div className="text-center py-16">
            <ShieldCheck size={28} className="mx-auto opacity-30" style={{ color: 'var(--sx-ink-3)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--sx-ink-2)' }}>
              Nothing in the {filter} queue.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--sx-line)' }}>
            {subs.map((s: any) => (
              <li key={s.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-black/[0.015] transition"
                  style={{ borderTopColor: 'var(--sx-line)' }}>
                <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' }}>
                    {(s.profile?.full_name ?? '?').split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--sx-ink)' }}>{s.profile?.full_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--sx-ink-3)' }}>
                      <span className="font-mono">{s.profile?.rm_id}</span> · {s.profile?.email}
                    </p>
                  </div>
                </div>

                <div className="col-span-6 md:col-span-2">
                  <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>ID type</p>
                  <p className="text-sm font-semibold uppercase" style={{ color: 'var(--sx-ink)' }}>{s.id_type}</p>
                </div>

                <div className="col-span-6 md:col-span-2">
                  <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>Country</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--sx-ink)' }}>{s.country}</p>
                </div>

                <div className="col-span-6 md:col-span-2">
                  <span className={`sx-pill ${STATUS_PILL[s.status] ?? ''}`}>{s.status}</span>
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--sx-ink-3)' }}>
                    {format(new Date(s.submitted_at), 'dd MMM, HH:mm')}
                  </p>
                </div>

                <div className="col-span-6 md:col-span-1 text-right">
                  <Link href={`/admin/kyc/${s.user_id}`} className="sx-btn sx-btn-secondary text-xs">
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: any) {
  return (
    <div className="sx-card p-5 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-white" style={{ background: accent }}>
        <Icon size={16} />
      </span>
      <div>
        <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>{label}</p>
        <p className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>{value}</p>
      </div>
    </div>
  )
}
