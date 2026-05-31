'use client';
import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  pulseOffset: number;
  angle: number;
  angleVelocity: number;
}

const NODE_COUNT = 32;
const MAX_DIST = 220;
const SPEED = 0.18;

function makeNode(w: number, h: number): Node {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * SPEED * (0.4 + Math.random() * 0.6),
    vy: Math.sin(angle) * SPEED * (0.4 + Math.random() * 0.6),
    scale: 0.32 + Math.random() * 0.28,
    pulseOffset: Math.random() * Math.PI * 2,
    angle: Math.random() * Math.PI * 2,
    angleVelocity: (Math.random() - 0.5) * 0.0012,
  };
}

// Draws the DUX duck logo silhouette centered at (0,0), viewBox 0 0 32 32
function drawDuckSilhouette(ctx: CanvasRenderingContext2D, fillColor: string, eyeColor: string) {
  ctx.fillStyle = fillColor;

  // Body: large round oval
  ctx.beginPath();
  ctx.ellipse(14, 22, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head: round circle
  ctx.beginPath();
  ctx.arc(20, 10, 7, 0, Math.PI * 2);
  ctx.fill();

  // Beak: small triangle pointing right
  ctx.beginPath();
  ctx.moveTo(25, 9.5);
  ctx.lineTo(30, 11.5);
  ctx.lineTo(25, 13.5);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(22, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let nodes: Node[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes = Array.from({ length: NODE_COUNT }, () =>
        makeNode(canvas.width, canvas.height)
      );
    };

    resize();
    window.addEventListener('resize', resize);

    let t = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      t += 0.012;

      // Update positions and rotation
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.angle += n.angleVelocity;
        if (n.x < -50) n.x = width + 50;
        if (n.x > width + 50) n.x = -50;
        if (n.y < -50) n.y = height + 50;
        if (n.y > height + 50) n.y = -50;
      }

      // Draw connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 215, 78, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw ducks
      for (const n of nodes) {
        const pulse = 1 + 0.25 * Math.sin(t + n.pulseOffset);
        const s = n.scale * pulse;

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.angle);
        ctx.scale(s, s);
        ctx.translate(-16, -16); // center the 32×32 viewBox

        // Soft glow via shadow
        ctx.shadowColor = 'rgba(255, 215, 78, 0.35)';
        ctx.shadowBlur = 10 / s;

        drawDuckSilhouette(ctx, 'rgba(255, 215, 78, 0.55)', 'rgba(237, 230, 220, 0.8)');

        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
