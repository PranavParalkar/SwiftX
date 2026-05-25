import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

/**
 * Onboarding shell — minimal branded layout (no topnav).
 *
 * All KYC routing is **server-side** and uses adminClient so RLS recursion
 * in `profiles_select_own` can't cause the dashboard ↔ onboarding loop.
 * Individual pages handle their own sub-status checks too.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, kyc_status')
    .eq('id', user.id)
    .single()

  // Admins never go through onboarding.
  if (profile?.role === 'admin') redirect('/admin')

  // Verified users belong on the dashboard, not here.
  if (profile?.kyc_status === 'verified') redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sx-canvas)' }}>
      <header className="border-b backdrop-blur-xl sticky top-0 z-40"
              style={{ borderColor: 'var(--sx-line)', background: 'rgba(255,255,255,0.78)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 h-16 flex items-center">
          <Link href="/onboarding/kyc" className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7L12 3L20 7V17L12 21L4 17V7Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8 10L14 14M14 10L8 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>SwiftX</span>
          </Link>

          <span className="ml-3 text-xs font-bold uppercase tracking-wider hidden sm:inline"
                style={{ color: 'var(--sx-ink-3)' }}>· Onboarding</span>

          <form action="/api/auth/signout" method="post" className="ml-auto">
            <button type="submit"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-black/5"
                    style={{ color: 'var(--sx-ink-3)' }}>
              <LogOut size={13} /> Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-8 md:py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
