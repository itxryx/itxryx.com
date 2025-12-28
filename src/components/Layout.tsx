import { Outlet } from 'react-router'
import { Background } from './Background'
import { Header } from './Header'
import { Footer } from './Footer'
import { useGoogleAnalytics } from '../hooks/useGoogleAnalytics'

export function Layout() {
  useGoogleAnalytics()

  return (
    <>
      <Background />
      <div className="mx-auto w-full px-6 sm:max-w-[540px] md:max-w-[720px] xl:max-w-[1140px]">
        <Header />
        <main className="min-h-[70vh] text-[1.6rem]">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  )
}
