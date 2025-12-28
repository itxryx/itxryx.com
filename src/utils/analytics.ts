declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export function initializeGA(trackingId: string): void {
  if (!trackingId || typeof window === 'undefined') return

  // gtag.jsスクリプトを動的に挿入
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`
  document.head.appendChild(script)

  // dataLayerとgtagの初期化
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', trackingId)
}

export function trackPageView(path: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
    })
  }
}
