import { useEffect, useRef } from 'react'

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resizeCanvas() {
      if (!canvas || !ctx) return
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      generateNoise()
      applyColorMask()
    }

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

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 block h-screen w-screen bg-background opacity-96"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    />
  )
}
