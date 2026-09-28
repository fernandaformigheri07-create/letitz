import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Globo digital próprio, desenhado em canvas 2D com projeção ortográfica.
 * Sem bibliotecas de globo: pontos de terra, meridianos, varredura, marcador
 * de região e pulsos de atividade.
 */

interface GlobeProps {
  target?: { lat: number; lng: number } | null;
  searching?: boolean;
  className?: string;
}

// Caixas aproximadas de massa continental (representação visual).
const LAND: Array<[number, number, number, number]> = [
  [-35, 12, -81, -34],
  [12, 33, -118, -86],
  [25, 52, -125, -62],
  [52, 72, -168, -128],
  [60, 83, -58, -20],
  [36, 70, -10, 40],
  [-35, 37, -18, 52],
  [20, 55, 40, 140],
  [-11, 30, 65, 108],
  [-45, -10, 112, 154],
  [55, 75, 60, 180],
  [-90, -66, -180, 180],
];

function isLand(lat: number, lng: number) {
  return LAND.some(([la1, la2, lo1, lo2]) => lat >= la1 && lat <= la2 && lng >= lo1 && lng <= lo2);
}

interface Pt {
  lat: number;
  lng: number;
  seed: number;
}

function buildPoints(count: number): Pt[] {
  const pts: Pt[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lng = (((i * golden) % (2 * Math.PI)) * 180) / Math.PI - 180;
    if (isLand(lat, lng)) pts.push({ lat, lng, seed: (i % 17) / 17 });
  }
  return pts;
}

export function DigitalGlobe({ target, searching = false, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ target, searching });
  stateRef.current = { target, searching };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = buildPoints(5200);
    let raf = 0;
    let rotation = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const project = (lat: number, lng: number, r: number, cx: number, cy: number, rot: number) => {
      const phi = (lat * Math.PI) / 180;
      const theta = ((lng + rot) * Math.PI) / 180;
      const x = Math.cos(phi) * Math.sin(theta);
      const y = Math.sin(phi);
      const z = Math.cos(phi) * Math.cos(theta);
      return { x: cx + x * r, y: cy - y * r, z };
    };

    const draw = (time: number) => {
      const { target: tgt, searching: isSearching } = stateRef.current;
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.4;

      rotation += isSearching ? 0.16 : 0.07;

      ctx.clearRect(0, 0, width, height);

      // atmosfera
      const halo = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.35);
      halo.addColorStop(0, "rgba(90,130,255,0.16)");
      halo.addColorStop(0.55, "rgba(120,90,255,0.07)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // esfera
      const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r);
      body.addColorStop(0, "rgba(28,36,62,0.95)");
      body.addColorStop(0.7, "rgba(12,16,28,0.95)");
      body.addColorStop(1, "rgba(7,9,14,1)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(120,150,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // paralelos
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        const ry = r * Math.cos((lat * Math.PI) / 180);
        ctx.ellipse(cx, cy - r * Math.sin((lat * Math.PI) / 180), ry, ry * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(120,150,255,0.07)";
        ctx.stroke();
      }

      // meridianos
      for (let lng = 0; lng < 180; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 4) {
          const p = project(lat, lng, r, cx, cy, rotation);
          if (p.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(120,150,255,0.06)";
        ctx.stroke();
      }

      // pontos de terra
      for (const pt of points) {
        const p = project(pt.lat, pt.lng, r, cx, cy, rotation);
        if (p.z <= 0.02) continue;
        const depth = p.z;
        const alpha = 0.1 + depth * 0.5;
        const size = depth * 1.35;
        ctx.fillStyle = `rgba(150,180,255,${alpha.toFixed(3)})`;
        ctx.fillRect(p.x, p.y, size, size);
      }

      // atividade luminosa
      const activityCount = isSearching ? 22 : 9;
      for (let i = 0; i < activityCount; i++) {
        const pt = points[(i * 137 + Math.floor(time / 900)) % points.length];
        if (!pt) continue;
        const p = project(pt.lat, pt.lng, r, cx, cy, rotation);
        if (p.z <= 0.05) continue;
        const beat = (Math.sin(time / 420 + i) + 1) / 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1 + beat * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? `rgba(160,120,255,${0.3 + beat * 0.5})` : `rgba(90,150,255,${0.3 + beat * 0.6})`;
        ctx.fill();
      }

      // marcador da região pesquisada
      if (tgt) {
        const p = project(tgt.lat, tgt.lng, r, cx, cy, rotation);
        if (p.z > 0) {
          const beat = (Math.sin(time / 300) + 1) / 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 + beat * 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(120,170,255,${0.55 - beat * 0.4})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(190,215,255,0.95)";
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 26, p.y - 26);
          ctx.lineTo(p.x + 58, p.y - 26);
          ctx.strokeStyle = "rgba(140,170,255,0.4)";
          ctx.stroke();
        }
      }

      // varredura
      if (isSearching) {
        const sweep = ((time / 2600) % 1) * 2 - 1;
        const y = cy + sweep * r;
        const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
        const grad = ctx.createLinearGradient(cx - half, y, cx + half, y);
        grad.addColorStop(0, "rgba(120,160,255,0)");
        grad.addColorStop(0.5, "rgba(150,180,255,0.55)");
        grad.addColorStop(1, "rgba(120,160,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx + half, y);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("size-full", className)}
      style={{ display: "block" }}
    />
  );
}
