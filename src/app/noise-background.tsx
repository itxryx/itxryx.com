"use client";

import { useEffect, useRef } from "react";

const noiseSettings = {
  baseColor: 51,
  cloudContrast: 12,
  cloudScale: 0.0028,
  cloudPixelSize: 4,
  grainTileSize: 256,
  grainMaxAlpha: 26,
  maxPixelRatio: 2,
};

const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
  75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
  149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
  27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105,
  92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73,
  209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
  164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38,
  147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
  28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101,
  155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
  191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
  181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
  138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
  61, 156, 180,
];

const gradients = [...permutation, ...permutation];

function fade(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(start: number, end: number, amount: number) {
  return start + amount * (end - start);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function grad(hash: number, x: number, y: number) {
  switch (hash & 3) {
    case 0:
      return x + y;
    case 1:
      return -x + y;
    case 2:
      return x - y;
    default:
      return -x - y;
  }
}

function perlin(x: number, y: number) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = gradients[gradients[xi] + yi];
  const ab = gradients[gradients[xi] + yi + 1];
  const ba = gradients[gradients[xi + 1] + yi];
  const bb = gradients[gradients[xi + 1] + yi + 1];

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

  return lerp(x1, x2, v);
}

function getPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, noiseSettings.maxPixelRatio);
}

function drawClouds(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const { baseColor, cloudContrast, cloudScale, cloudPixelSize } =
    noiseSettings;
  const ratio = getPixelRatio();
  const width = Math.ceil((window.innerWidth * ratio) / cloudPixelSize);
  const height = Math.ceil((window.innerHeight * ratio) / cloudPixelSize);

  canvas.width = width;
  canvas.height = height;

  const image = context.createImageData(width, height);
  const sampleScale = cloudScale * cloudPixelSize;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = perlin(x * sampleScale, y * sampleScale);
      const shade = clamp(
        Math.round(baseColor + value * cloudContrast),
        0,
        255,
      );
      const index = (y * width + x) * 4;

      image.data[index] = shade;
      image.data[index + 1] = shade;
      image.data[index + 2] = shade;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
}

function createGrainTile() {
  const { grainTileSize, grainMaxAlpha } = noiseSettings;
  const tile = document.createElement("canvas");

  tile.width = grainTileSize;
  tile.height = grainTileSize;

  const context = tile.getContext("2d");

  if (!context) {
    return tile;
  }

  const image = context.createImageData(grainTileSize, grainTileSize);

  for (let index = 0; index < image.data.length; index += 4) {
    const shade = Math.random() < 0.5 ? 0 : 255;

    image.data[index] = shade;
    image.data[index + 1] = shade;
    image.data[index + 2] = shade;
    image.data[index + 3] = Math.round(Math.random() * grainMaxAlpha);
  }

  context.putImageData(image, 0, 0);

  return tile;
}

function drawGrain(canvas: HTMLCanvasElement, tile: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const ratio = getPixelRatio();

  canvas.width = Math.ceil(window.innerWidth * ratio);
  canvas.height = Math.ceil(window.innerHeight * ratio);

  const pattern = context.createPattern(tile, "repeat");

  if (!pattern) {
    return;
  }

  context.fillStyle = pattern;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

export function NoiseBackground() {
  const cloudCanvasRef = useRef<HTMLCanvasElement>(null);
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cloudCanvas = cloudCanvasRef.current;
    const grainCanvas = grainCanvasRef.current;

    if (!cloudCanvas || !grainCanvas) {
      return;
    }

    const grainTile = createGrainTile();

    const drawAll = () => {
      drawClouds(cloudCanvas);
      drawGrain(grainCanvas, grainTile);
    };

    drawAll();

    let resizeTimer: number;

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(drawAll, 120);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <canvas className="size-full bg-[#333]" ref={cloudCanvasRef} />
      <canvas className="absolute inset-0 size-full" ref={grainCanvasRef} />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_45%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}
