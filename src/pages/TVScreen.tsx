import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import cafeApi from "../api/cafeApi";


type TvBirthday = {
  _id: string;
  nombre: string;
  fecha: string;
  activo: boolean;
};

function LuxuryCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let raf = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const confetti = Array.from({ length: 42 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * -h,
      size: Math.random() * 7 + 4,
      speed: Math.random() * 1.1 + 0.5,
      rot: Math.random() * Math.PI,
      drift: Math.random() * 0.5 - 0.25,
      color: ["#d4af37", "#e13f44", "#fff2d0", "#b8872f"][Math.floor(Math.random() * 4)],
    }));

    const balloons = Array.from({ length: 6 }).map((_, i) => ({
      x: (w / 7) * (i + 1),
      y: -120 - Math.random() * h,
      speed: 0.55 + Math.random() * 0.45,
      sway: Math.random() * 0.8 + 0.4,
      phase: Math.random() * 10,
      scale: 0.78 + Math.random() * 0.28,
      c1: i % 3 === 0 ? "#f33a46" : i % 3 === 1 ? "#d7a93e" : "#171717",
      c2: i % 3 === 0 ? "#670005" : i % 3 === 1 ? "#6b4300" : "#050505",
    }));

    const particles = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.7,
      speed: Math.random() * 0.25 + 0.08,
      color: Math.random() > 0.5 ? "#d4af37" : "#fff2d0",
    }));

    const drawBalloon = (x: number, y: number, scale: number, c1: string, c2: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const grad = ctx.createRadialGradient(-16, -22, 4, 4, 10, 66);
      grad.addColorStop(0, "rgba(255,255,255,.9)");
      grad.addColorStop(0.2, c1);
      grad.addColorStop(1, c2);

      ctx.shadowBlur = 22;
      ctx.shadowColor = c1;

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -58);
      ctx.bezierCurveTo(42, -56, 50, -8, 34, 28);
      ctx.bezierCurveTo(22, 54, 5, 62, 0, 70);
      ctx.bezierCurveTo(-5, 62, -22, 54, -34, 28);
      ctx.bezierCurveTo(-50, -8, -42, -56, 0, -58);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(-7, 66);
      ctx.lineTo(7, 66);
      ctx.lineTo(0, 80);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255,215,160,.42)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 78);
      ctx.bezierCurveTo(-8, 112, 10, 140, -3, 172);
      ctx.stroke();

      ctx.restore();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#030303");
      bg.addColorStop(0.45, "#100505");
      bg.addColorStop(1, "#030303");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const centerGlow = ctx.createRadialGradient(w / 2, h * 0.46, 10, w / 2, h * 0.46, w * 0.42);
      centerGlow.addColorStop(0, "rgba(225,63,68,.34)");
      centerGlow.addColorStop(0.55, "rgba(120,20,25,.18)");
      centerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, w, h);

      const topGlow = ctx.createRadialGradient(w / 2, h * 0.12, 10, w / 2, h * 0.12, w * 0.34);
      topGlow.addColorStop(0, "rgba(255,195,90,.28)");
      topGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, w, h);

      balloons.forEach((b) => {
        b.y += b.speed;
        const x = b.x + Math.sin(t / 1200 + b.phase) * 28 * b.sway;

        if (b.y > h + 210) {
          b.y = -180 - Math.random() * 280;
          b.x = Math.random() * w;
        }

        drawBalloon(x, b.y, b.scale, b.c1, b.c2);
      });

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }

        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      confetti.forEach((c) => {
        c.y += c.speed;
        c.x += c.drift;
        c.rot += 0.025;

        if (c.y > h + 30) {
          c.y = -40;
          c.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = 0.52;
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 3, c.size, c.size * 0.42);
        ctx.restore();
      });

      const sweepX = ((t / 22) % (w * 1.8)) - w * 0.4;
      const sweep = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, 0);
      sweep.addColorStop(0, "transparent");
      sweep.addColorStop(0.5, "rgba(255,255,255,.16)");
      sweep.addColorStop(1, "transparent");
      ctx.fillStyle = sweep;
      ctx.fillRect(0, h * 0.42, w, h * 0.18);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0 }} />;
}

export default function TVScreen() {
  const [items, setItems] = useState<TvBirthday[]>([]);
  const [index, setIndex] = useState(0);

  const cargar = async () => {
    try {
      const { data } = await cafeApi.get("/tv-birthdays/today");
      setItems(data.items || []);
    } catch {}
  };

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, 30000);
    return () => clearInterval(timer);
  }, []);

const slides = useMemo(() => (items.length === 0 ? [] : items), [items]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 60000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];

  if (!current) {
  return (
    <Box sx={{ width: "100vw", height: "100vh", bgcolor: "#000" }} />
  );
}

  const cumple = current as TvBirthday;

  return (
    <Box sx={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", bgcolor: "#000" }}>
      <LuxuryCanvas />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 6,
        }}
      >
        <Typography
          sx={{
            fontSize: "5.2vw",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontStyle: "italic",
            color: "#ffd37c",
            letterSpacing: ".04em",
            textShadow: "0 0 28px rgba(255,190,90,.95)",
            mb: 2,
          }}
        >
          Feliz Cumpleaños
        </Typography>

        <Typography
          sx={{
            fontSize: cumple.nombre.length > 14 ? "7.2vw" : "8.8vw",
            fontWeight: 950,
            lineHeight: 0.92,
            textTransform: "uppercase",
            letterSpacing: ".065em",
            background:
              "linear-gradient(180deg,#ffffff 0%,#e8e8e8 35%,#9f9f9f 58%,#ffffff 82%,#d6d6d6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter:
              "drop-shadow(0 18px 35px rgba(0,0,0,.95)) drop-shadow(0 0 20px rgba(255,255,255,.28))",
          }}
        >
          {cumple.nombre}
        </Typography>

        <Typography
          sx={{
            mt: 7,
            fontSize: "1.85vw",
            letterSpacing: ".55em",
            color: "rgb(225,63,68)",
            textTransform: "uppercase",
            fontWeight: 500,
            textShadow: "0 0 16px rgba(225,63,68,.8)",
          }}
        >
          Restaurante View
        </Typography>
      </Box>
    </Box>
  );
}