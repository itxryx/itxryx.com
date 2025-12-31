import { useEffect, useRef } from 'react'

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let previousWidth = window.innerWidth

    function generateNoise() {
      if (!canvas || !ctx) return
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const buffer = new Uint32Array(imageData.data.buffer)
      for (let i = 0; i < buffer.length; i++) {
        const grayscale = Math.random() * 255
        buffer[i] = (255 << 24) | (grayscale << 16) | (grayscale << 8) | grayscale
      }
      ctx.putImageData(imageData, 0, 0)
    }

    function applyColorMask() {
      if (!canvas || !ctx) return
      ctx.globalAlpha = 0.96
      ctx.fillStyle = '#333'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1.0
    }

    function resizeAndDraw() {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      generateNoise()
      applyColorMask()
    }

    function handleResize() {
      const currentWidth = window.innerWidth
      if (currentWidth !== previousWidth) {
        previousWidth = currentWidth
        resizeAndDraw()
      }
    }

    requestAnimationFrame(resizeAndDraw)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 block h-screen w-screen bg-background"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    />
  )
}
