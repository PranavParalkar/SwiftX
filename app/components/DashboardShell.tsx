'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { useLang } from '@/lib/i18n'

/**
 * AppFrame — top-nav + content workspace for SwiftX.
 * (Filename retained for import compatibility; structure is brand-new.)
 */
export default function DashboardShell({ profile, children }: { profile: any; children: React.ReactNode }) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const { t } = useLang()

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenu(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sx-canvas)' }}>
      <Sidebar profile={profile} mobileOpen={mobileMenu} setMobileOpen={setMobileMenu} />

      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-16">
          <div className="sx-fade-up">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t mt-auto" style={{ borderColor: 'var(--sx-line)' }}>
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-3 text-xs"
             style={{ color: 'var(--sx-ink-3)' }}>
          <span>© {new Date().getFullYear()} SwiftX — {t('footer.tagline')}</span>
          <span className="flex items-center gap-2"><span className="sx-pulse-dot" /> {t('common.systemshealthy')} · v1.0</span>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--sx-line)' }}>
          <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-8 grid gap-6 text-xs sm:grid-cols-2 lg:grid-cols-3"
               style={{ color: 'var(--sx-ink-3)' }}>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--sx-ink-2)' }}>
                {t('footer.support.title')}
              </p>
              <p>{t('footer.support.desc')}</p>
              <a className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="mailto:support@swiftx.app">
                support@swiftx.app
              </a>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--sx-ink-2)' }}>
                {t('footer.contact.title')}
              </p>
              <p>{t('footer.contact.desc')}</p>
              <a className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="mailto:contact@swiftx.app">
                contact@swiftx.app
              </a>
              <div>
                <Link className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="/contact">
                  {t('footer.contact.cta')}
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--sx-ink-2)' }}>
                {t('footer.faq.title')}
              </p>
              <div className="space-y-2">
                <details className="group">
                  <summary className="cursor-pointer list-none font-medium" style={{ color: 'var(--sx-ink-2)' }}>
                    {t('footer.faq.q1')}
                  </summary>
                  <p className="mt-1" style={{ color: 'var(--sx-ink-3)' }}>{t('footer.faq.a1')}</p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer list-none font-medium" style={{ color: 'var(--sx-ink-2)' }}>
                    {t('footer.faq.q2')}
                  </summary>
                  <p className="mt-1" style={{ color: 'var(--sx-ink-3)' }}>{t('footer.faq.a2')}</p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer list-none font-medium" style={{ color: 'var(--sx-ink-2)' }}>
                    {t('footer.faq.q3')}
                  </summary>
                  <p className="mt-1" style={{ color: 'var(--sx-ink-3)' }}>{t('footer.faq.a3')}</p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
