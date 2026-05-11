'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import Navbar from '@/components/Navbar'
import { Link } from '@/i18n/navigation'
import { buildAuthenticatedHomeTarget } from '@/lib/home/default-route'

export default function Home() {
  const t = useTranslations('landing')
  const tc = useTranslations('common')
  const { data: session, status } = useSession()
  const router = useRouter()

  // 已登录用户自动跳转到 home
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(buildAuthenticatedHomeTarget())
    }
  }, [status, router])

  // session 加载中或已登录（即将跳转），不渲染落地页，避免闪烁
  if (status !== 'unauthenticated') {
    return (
      <div className="glass-page min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo-small.png?v=1"
            alt={tc('appName')}
            width={80}
            height={80}
            className="animate-pulse"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-page min-h-screen overflow-hidden font-sans selection:bg-[var(--glass-tone-info-bg)]">
      {/* Navbar */}
      {/* <div className="relative z-50">
        <Navbar />
      </div> */}

      {/* Background */}
      {/* <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(138,170,255,0.12),transparent),radial-gradient(900px_500px_at_0%_100%,rgba(148,163,184,0.16),transparent)]"></div>
      </div> */}

      <main className="relative z-10 h-screen">
        <section className="relative h-full w-full">
          <div className="relative w-full h-full">
            <video
              src="/video/cb0b1f9da457ee55aac39fe2996c4ba2.mp4"
              autoPlay
              muted
               playsInline
              className="w-full h-full object-cover block"
            />
            {/* 透明遮罩层 */}
            <div className="absolute inset-0 bg-black/10 flex items-start justify-end pt-4 pr-4">
              <Link
                href={{ pathname: '/auth/signin' }}
                className="px-6 py-2.5 rounded-xl text-white font-semibold text-base backdrop-blur-md bg-white/20 border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg"
              >
                {t('getStarted')}
              </Link>
            </div>
          </div>

        </section>
      </main>
    </div>
  )
}
