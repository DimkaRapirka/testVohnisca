'use client';

import { useEffect, useRef } from 'react';

export function Campfire() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }

    const particles: Particle[] = [];

    function createParticle() {
      const angle = (Math.random() - 0.5) * 0.5;
      particles.push({
        x: 200 + (Math.random() - 0.5) * 40,
        y: 350,
        vx: Math.sin(angle) * 0.5,
        vy: -2 - Math.random() * 2,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: 3 + Math.random() * 4,
      });
    }

    function animate() {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create new particles
      if (Math.random() < 0.3) {
        createParticle();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeRatio = p.life / p.maxLife;

        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Color gradient from orange to red to dark
        let r, g, b;
        if (lifeRatio < 0.3) {
          r = 255;
          g = 107 + (161 - 107) * (lifeRatio / 0.3);
          b = 53;
        } else if (lifeRatio < 0.6) {
          r = 255;
          g = 161 - 161 * ((lifeRatio - 0.3) / 0.3);
          b = 53;
        } else {
          r = 255 - 155 * ((lifeRatio - 0.6) / 0.4);
          g = 0;
          b = 53 - 53 * ((lifeRatio - 0.6) / 0.4);
        }

        const alpha = 1 - lifeRatio;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="mx-auto"
        style={{ filter: 'blur(1px)' }}
      />
      <div className="absolute inset-0 bg-fire-glow pointer-events-none" />
    </div>
  );
}
