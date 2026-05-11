'use client'

import { useState } from "react"
import { useTranslations } from 'next-intl'
import Navbar from "@/components/Navbar"
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator"
import { apiFetch } from '@/lib/api-fetch'
import { Link, useRouter } from '@/i18n/navigation'

export default function SignUp() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const t = useTranslations('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'))
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t('signupSuccess'))
        setTimeout(() => {
          router.push({ pathname: '/auth/signin' })
        }, 2000)
      } else {
        setError(data.message || t('signupFailed'))
      }
    } catch {
      setError(t('signupError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="glass-page min-h-screen"
      style={{
        backgroundImage: "url('/plugin.jpg')",
        backgroundSize: "auto 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#020617",
      }}
    >
      <Navbar />
      <div className="flex items-center justify-center  px-4 py-12">
        <div className="max-w-md w-full" >
          <div className="glass-surface-modal translate-y-[230px] p-8 !bg-transparent">
            {/* <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-2">
                {t('createAccount')}
              </h1>
              <p className="text-[var(--glass-text-secondary)]">{t('joinPlatform')}</p>
            </div> */}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                {/* <label htmlFor="name" className="glass-field-label block mb-2">
                  {t('phoneNumber')}
                </label> */}
                <input
                  id="name"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="glass-input-base w-full px-4 py-3"
                  placeholder={t('phoneNumberPlaceholder')}
                />
              </div>

              <div className="translate-y-[90px] space-y-3">
                <div className="flex flex-row gap-3 items-start">
                  <div className="min-w-0 flex-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="glass-input-base w-full px-4 py-3"
                      placeholder={t('passwordMinPlaceholder')}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="glass-input-base w-full px-4 py-3"
                      placeholder={t('confirmPasswordPlaceholder')}
                    />
                  </div>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              {error && (
                <div className="bg-[var(--glass-tone-danger-bg)] border border-[color:color-mix(in_srgb,var(--glass-tone-danger-fg)_22%,transparent)] text-[var(--glass-tone-danger-fg)] px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-[var(--glass-tone-success-bg)] border border-[color:color-mix(in_srgb,var(--glass-tone-success-fg)_22%,transparent)] text-[var(--glass-tone-success-fg)] px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-transparent py-3 px-4 text-lg font-extrabold text-white shadow-none outline-none ring-0 transition-opacity hover:opacity-90 focus-visible:underline disabled:cursor-not-allowed disabled:opacity-50 translate-y-[160px]"
              >
                {loading ? t('signupButtonLoading') : t('signupButton')}
              </button>
            </form>

            {/* <div className="mt-6 text-center">
              <p className="text-[var(--glass-text-secondary)]">
                {t('hasAccount')}{" "}
                <Link href={{ pathname: '/auth/signin' }} className="text-[var(--glass-tone-info-fg)] hover:underline font-medium">
                  {t('signinNow')}
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href={{ pathname: '/' }} className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] text-sm">
                {t('backToHome')}
              </Link>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}
