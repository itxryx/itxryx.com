import {
    useEffect,
    useRef
} from "react";

export const Background = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        function resizeCanvas() {
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;

            generateNoise();
            applyColorMask();
        }

        function generateNoise() {
            const imageData = ctx.createImageData(canvas.width, canvas.height);
            const buffer = new Uint32Array(imageData.data.buffer);
            for (let i = 0; i < buffer.length; i++) {
                const grayscale = Math.random() * 255;
                buffer[i] = (255 << 24) | (grayscale << 16) | (grayscale << 8) | grayscale;
            }
            ctx.putImageData(imageData, 0, 0);
        }

        function applyColorMask() {
            ctx.globalAlpha = 0.96;
            ctx.fillStyle = "#333";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
        }

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        generateNoise();
        applyColorMask();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    return <canvas
        ref={canvasRef}
        id="background"
    />;
}
