'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export default function ContactPage() {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const mailtoHref = useMemo(() => {
    const safeSubject = subject.trim() || t('contact.form.defaultSubject')
    const lines = [
      `Name: ${name || '-'}`,
      `Email: ${email || '-'}`,
      '',
      message || '-',
    ]
    const body = encodeURIComponent(lines.join('\n'))
    return `mailto:swiftx@gmail.com?subject=${encodeURIComponent(safeSubject)}&body=${body}`
  }, [name, email, subject, message, t])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    window.location.href = mailtoHref
  }

  return (
    <div className="min-h-screen w-full" style={{ background: 'var(--sx-canvas)' }}>
      <section className="mx-auto w-full max-w-[1100px] px-6 sm:px-10 lg:px-12 py-12 sm:py-16">
        <div className="sx-fade-up grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="sx-h-eyebrow">{t('contact.eyebrow')}</p>
            <h1 className="sx-h-title mt-2">{t('contact.title')}</h1>
            <p className="sx-h-sub mt-3 max-w-xl">{t('contact.desc')}</p>

            <div className="mt-8 space-y-3 text-sm" style={{ color: 'var(--sx-ink-3)' }}>
              <div>
                <p className="font-semibold" style={{ color: 'var(--sx-ink)' }}>{t('contact.direct.title')}</p>
                <a className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="mailto:swiftx@gmail.com">
                  swiftx@gmail.com
                </a>
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--sx-ink)' }}>{t('contact.return.title')}</p>
                <Link className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="/dashboard">
                  {t('contact.return.cta')}
                </Link>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-3xl border"
                style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)' }}>
            <div className="sx-field">
              <input
                id="contact-name"
                type="text"
                placeholder=" "
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <label htmlFor="contact-name">{t('contact.form.name')}</label>
            </div>

            <div className="sx-field">
              <input
                id="contact-email"
                type="email"
                placeholder=" "
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <label htmlFor="contact-email">{t('contact.form.email')}</label>
            </div>

            <div className="sx-field">
              <input
                id="contact-subject"
                type="text"
                placeholder=" "
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <label htmlFor="contact-subject">{t('contact.form.subject')}</label>
            </div>

            <div className="sx-field">
              <textarea
                id="contact-message"
                placeholder=" "
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                required
              />
              <label htmlFor="contact-message">{t('contact.form.message')}</label>
            </div>

            <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>
              {t('contact.form.note')}
            </p>

            <button type="submit" className="sx-btn sx-btn-primary w-full py-3 text-[15px]">
              {t('contact.form.send')}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
