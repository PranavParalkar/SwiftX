'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react'

export default function KycReviewPanel({
  userId, currentStatus,
}: { userId: string; currentStatus: 'pending' | 'verified' | 'rejected' }) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'rejecting'>('idle')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function act(action: 'approve' | 'reject') {
    setError('')
    setBusy(true)
    const res = await fetch('/api/admin/kyc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        action,
        rejection_reason: action === 'reject' ? reason.trim() : null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data?.error || 'Action failed'); return }
    router.refresh()
    setMode('idle')
    setReason('')
  }

  return (
    <div className="sx-card p-5">
      <p className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--sx-ink-3)' }}>
        Decision
      </p>

      {error && (
        <div className="text-sm font-medium rounded-xl px-3 py-2 mb-3"
             style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
          {error}
        </div>
      )}

      {currentStatus === 'verified' ? (
        <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>
          This member is already verified. You can still reject below if a recheck is needed.
        </p>
      ) : null}

      {mode === 'idle' && (
        <div className="space-y-2">
          <button onClick={() => act('approve')} disabled={busy}
                  className="sx-btn sx-btn-success w-full">
            {busy ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve KYC
          </button>
          <button onClick={() => setMode('rejecting')} disabled={busy}
                  className="sx-btn sx-btn-danger w-full">
            <AlertOctagon size={14} /> Reject
          </button>
        </div>
      )}

      {mode === 'rejecting' && (
        <div className="space-y-3">
          <div className="sx-field">
            <textarea id="rej" rows={4} placeholder=" "
                      value={reason} onChange={e => setReason(e.target.value)} />
            <label htmlFor="rej">Reason (member sees this)</label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setMode('idle'); setReason('') }} disabled={busy}
                    className="sx-btn sx-btn-ghost flex-1">
              Cancel
            </button>
            <button onClick={() => act('reject')} disabled={busy || !reason.trim()}
                    className="sx-btn sx-btn-danger flex-1">
              {busy ? <RefreshCw size={14} className="animate-spin" /> : null}
              Confirm rejection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
