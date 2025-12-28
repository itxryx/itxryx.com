import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { initializeGA, trackPageView } from '../utils/analytics'

export function useGoogleAnalytics(): void {
  const location = useLocation()
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID

  // 初回マウント時にGAを初期化
  useEffect(() => {
    if (trackingId) {
      initializeGA(trackingId)
    }
  }, [trackingId])

  // ルート変更時にページビューを送信
  useEffect(() => {
    if (trackingId) {
      trackPageView(location.pathname)
    }
  }, [location.pathname, trackingId])
}
