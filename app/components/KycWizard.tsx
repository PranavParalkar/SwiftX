'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, User2, IdCard, MapPin, Landmark, ClipboardCheck,
  ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw,
} from 'lucide-react'

type Form = {
  full_name: string
  date_of_birth: string
  gender: '' | 'male' | 'female' | 'other' | 'prefer_not_to_say'
  nationality: string

  id_type: 'pan' | 'aadhaar' | 'passport' | 'ssn' | 'nin' | 'drivers_license' | 'other'
  id_number: string
  secondary_id_type: '' | 'pan' | 'aadhaar' | 'passport' | 'ssn' | 'nin' | 'drivers_license' | 'other'
  secondary_id_number: string

  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string

  bank_account_number: string
  bank_ifsc: string
  bank_holder_name: string

  occupation: string
  source_of_funds: string
}

const STEPS = [
  { key: 'personal', label: 'Personal',  icon: User2 },
  { key: 'identity', label: 'Identity',  icon: IdCard },
  { key: 'address',  label: 'Address',   icon: MapPin },
  { key: 'bank',     label: 'Bank',      icon: Landmark },
  { key: 'review',   label: 'Review',    icon: ClipboardCheck },
] as const

const ID_LABELS: Record<Form['id_type'], string> = {
  pan:             'PAN (India)',
  aadhaar:         'Aadhaar (India)',
  passport:        'Passport',
  ssn:             'SSN (USA)',
  nin:             'National Insurance / National ID',
  drivers_license: "Driver's licence",
  other:           'Other government ID',
}

const COUNTRIES = [
  ['IN', '🇮🇳 India'], ['US', '🇺🇸 United States'], ['GB', '🇬🇧 United Kingdom'],
  ['AE', '🇦🇪 United Arab Emirates'], ['SG', '🇸🇬 Singapore'], ['AU', '🇦🇺 Australia'],
  ['CA', '🇨🇦 Canada'], ['DE', '🇩🇪 Germany'], ['FR', '🇫🇷 France'], ['JP', '🇯🇵 Japan'],
] as const

export default function KycWizard({ defaultName = '' }: { defaultName?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agree, setAgree] = useState(false)

  const [form, setForm] = useState<Form>({
    full_name: defaultName,
    date_of_birth: '',
    gender: '',
    nationality: 'IN',
    id_type: 'pan',
    id_number: '',
    secondary_id_type: '',
    secondary_id_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    bank_account_number: '',
    bank_ifsc: '',
    bank_holder_name: defaultName,
    occupation: '',
    source_of_funds: '',
  })

  function up<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function canGoNext() {
    if (step === 0) return !!form.date_of_birth
    if (step === 1) return !!form.id_type && !!form.id_number.trim()
    if (step === 2) return !!form.address_line1.trim() && !!form.city.trim() && !!form.state.trim() && !!form.postal_code.trim() && !!form.country
    if (step === 3) return !!form.bank_account_number.trim() && !!form.bank_ifsc.trim() && !!form.bank_holder_name.trim()
    if (step === 4) return agree
    return true
  }

  async function submit() {
    setError('')
    setLoading(true)
    const res = await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data?.error || 'Submission failed'); return }
    router.replace('/onboarding/kyc/pending')
  }

  return (
    <div>
      {/* Heading */}
      <header className="mb-6">
        <p className="sx-h-eyebrow"><ShieldCheck size={12} className="inline -mt-0.5 mr-1" /> Verify your identity</p>
        <h1 className="sx-h-title mt-2">Complete your KYC</h1>
        <p className="sx-h-sub mt-1">
          Regulators require this before you can move money. Takes about 2 minutes — no OTPs needed.
        </p>
      </header>

      {/* Stepper */}
      <div className="sx-card p-3 mb-6">
        <ol className="grid grid-cols-5">
          {STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            const Icon = s.icon
            return (
              <li key={s.key} className="flex flex-col items-center text-center relative">
                {i > 0 && (
                  <span className="absolute top-4 right-1/2 w-full h-px"
                        style={{ background: done ? 'var(--sx-primary)' : 'var(--sx-line)' }} />
                )}
                <span className="relative z-10 w-9 h-9 rounded-full inline-flex items-center justify-center text-xs font-bold border-2"
                      style={{
                        borderColor: active || done ? 'var(--sx-primary)' : 'var(--sx-line)',
                        background:  active ? 'var(--sx-primary)' : done ? 'var(--sx-primary-soft)' : 'var(--sx-panel)',
                        color:       active ? '#fff'              : done ? 'var(--sx-primary)'     : 'var(--sx-ink-3)',
                      }}>
                  {done ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                </span>
                <span className="text-[10px] mt-1.5 font-semibold uppercase tracking-wide"
                      style={{ color: active || done ? 'var(--sx-ink)' : 'var(--sx-ink-3)' }}>
                  {s.label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Form */}
      <div className="sx-card p-6 md:p-8">
        {error && (
          <div className="mb-5 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2"
               style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--sx-ink)' }}>Personal details</h3>
            <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>Match this exactly to your government ID.</p>

            <div className="sx-field">
              <input id="k-name" placeholder=" " value={form.full_name} onChange={e => up('full_name', e.target.value)} />
              <label htmlFor="k-name">Full legal name</label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <input id="k-dob" type="date" placeholder=" " value={form.date_of_birth}
                       max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                       onChange={e => up('date_of_birth', e.target.value)} />
                <label htmlFor="k-dob">Date of birth (18+)</label>
              </div>
              <div className="sx-field">
                <select id="k-gender" value={form.gender} onChange={e => up('gender', e.target.value as any)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <label htmlFor="k-gender">Gender (optional)</label>
              </div>
            </div>

            <div className="sx-field">
              <select id="k-nat" value={form.nationality} onChange={e => up('nationality', e.target.value)}>
                {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
              <label htmlFor="k-nat">Nationality</label>
            </div>
          </div>
        )}

        {/* Step 1 — Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--sx-ink)' }}>Identity verification</h3>
            <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>Pick the primary government-issued ID we should verify you against.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <select id="k-idt" value={form.id_type} onChange={e => up('id_type', e.target.value as any)}>
                  {Object.entries(ID_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <label htmlFor="k-idt">Primary ID type</label>
              </div>
              <div className="sx-field">
                <input id="k-idn" placeholder=" " value={form.id_number}
                       onChange={e => up('id_number', e.target.value.toUpperCase())} />
                <label htmlFor="k-idn">Primary ID number</label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <select id="k-sidt" value={form.secondary_id_type} onChange={e => up('secondary_id_type', e.target.value as any)}>
                  <option value="">— none —</option>
                  {Object.entries(ID_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <label htmlFor="k-sidt">Secondary ID (optional)</label>
              </div>
              <div className="sx-field">
                <input id="k-sidn" placeholder=" " value={form.secondary_id_number}
                       onChange={e => up('secondary_id_number', e.target.value.toUpperCase())} />
                <label htmlFor="k-sidn">Secondary ID number</label>
              </div>
            </div>

            <div className="rounded-xl p-3 text-xs flex items-start gap-2"
                 style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              <span>Your ID details are encrypted at rest. We don't share them outside of regulator-mandated checks.</span>
            </div>
          </div>
        )}

        {/* Step 2 — Address */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--sx-ink)' }}>Residential address</h3>
            <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>Where do you currently live? This may be different from your nationality.</p>

            <div className="sx-field">
              <input id="k-a1" placeholder=" " value={form.address_line1} onChange={e => up('address_line1', e.target.value)} />
              <label htmlFor="k-a1">Address line 1</label>
            </div>
            <div className="sx-field">
              <input id="k-a2" placeholder=" " value={form.address_line2} onChange={e => up('address_line2', e.target.value)} />
              <label htmlFor="k-a2">Address line 2 (optional)</label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <input id="k-city" placeholder=" " value={form.city} onChange={e => up('city', e.target.value)} />
                <label htmlFor="k-city">City</label>
              </div>
              <div className="sx-field">
                <input id="k-state" placeholder=" " value={form.state} onChange={e => up('state', e.target.value)} />
                <label htmlFor="k-state">State / province</label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <input id="k-pc" placeholder=" " value={form.postal_code} onChange={e => up('postal_code', e.target.value.toUpperCase())} />
                <label htmlFor="k-pc">Postal / ZIP code</label>
              </div>
              <div className="sx-field">
                <select id="k-co" value={form.country} onChange={e => up('country', e.target.value)}>
                  {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
                <label htmlFor="k-co">Country</label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Bank */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--sx-ink)' }}>Linked bank account</h3>
            <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>
              For payouts and large-amount withdrawals. Must be in your own name.
            </p>

            <div className="sx-field">
              <input id="k-bn" placeholder=" " value={form.bank_holder_name} onChange={e => up('bank_holder_name', e.target.value)} />
              <label htmlFor="k-bn">Account holder name</label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <input id="k-ba" placeholder=" " value={form.bank_account_number} onChange={e => up('bank_account_number', e.target.value)} />
                <label htmlFor="k-ba">Account number</label>
              </div>
              <div className="sx-field">
                <input id="k-bi" placeholder=" " value={form.bank_ifsc} onChange={e => up('bank_ifsc', e.target.value.toUpperCase())} />
                <label htmlFor="k-bi">IFSC / SWIFT / Routing</label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sx-field">
                <input id="k-occ" placeholder=" " value={form.occupation} onChange={e => up('occupation', e.target.value)} />
                <label htmlFor="k-occ">Occupation (optional)</label>
              </div>
              <div className="sx-field">
                <select id="k-sof" value={form.source_of_funds} onChange={e => up('source_of_funds', e.target.value)}>
                  <option value="">Select</option>
                  <option value="salary">Salary</option>
                  <option value="business">Business income</option>
                  <option value="freelance">Freelance / contract</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment returns</option>
                  <option value="other">Other</option>
                </select>
                <label htmlFor="k-sof">Source of funds (optional)</label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--sx-ink)' }}>Review & confirm</h3>
            <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>
              Please double-check — once submitted you can't edit until a SwiftX admin reviews.
            </p>

            <ReviewBlock title="Personal" items={[
              ['Name', form.full_name],
              ['Date of birth', form.date_of_birth],
              ['Gender', form.gender || '—'],
              ['Nationality', form.nationality],
            ]} />
            <ReviewBlock title="Identity" items={[
              [ID_LABELS[form.id_type], maskTail(form.id_number)],
              ...(form.secondary_id_number ? [[ID_LABELS[form.secondary_id_type as keyof typeof ID_LABELS] ?? '—', maskTail(form.secondary_id_number)] as [string, string]] : []),
            ]} />
            <ReviewBlock title="Address" items={[
              ['Line 1', form.address_line1],
              ...(form.address_line2 ? [['Line 2', form.address_line2] as [string, string]] : []),
              ['City / State', `${form.city}, ${form.state}`],
              ['Postal · Country', `${form.postal_code} · ${form.country}`],
            ]} />
            <ReviewBlock title="Bank" items={[
              ['Holder', form.bank_holder_name],
              ['Account', maskTail(form.bank_account_number)],
              ['IFSC / SWIFT', form.bank_ifsc],
              ...(form.occupation ? [['Occupation', form.occupation] as [string, string]] : []),
              ...(form.source_of_funds ? [['Source of funds', form.source_of_funds] as [string, string]] : []),
            ]} />

            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 accent-indigo-600 w-4 h-4" />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--sx-ink-2)' }}>
                I confirm the information above is true and complete. I authorise SwiftX to verify it
                with regulatory and credit bureaux as required by law.
              </span>
            </label>
          </div>
        )}

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} disabled={loading}
                    className="sx-btn sx-btn-ghost">
              <ArrowLeft size={14} /> Back
            </button>
          ) : <span />}

          {step < STEPS.length - 1 ? (
            <button onClick={() => canGoNext() && setStep(s => s + 1)} disabled={!canGoNext()}
                    className="sx-btn sx-btn-primary">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={submit} disabled={!canGoNext() || loading}
                    className="sx-btn sx-btn-primary">
              {loading ? <><RefreshCw size={14} className="animate-spin" /> Submitting…</> : <>Submit for review <ArrowRight size={14} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewBlock({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
      <p className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--sx-ink-3)' }}>{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {items.map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <span className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>{k}</span>
            <span className="font-semibold" style={{ color: 'var(--sx-ink)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function maskTail(s: string): string {
  if (!s) return '—'
  const t = s.trim()
  if (t.length <= 4) return '••' + t
  return '••••' + t.slice(-4)
}
