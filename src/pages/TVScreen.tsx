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

    const colors = {
      red1: "#e13f44",
      red2: "#7a0007",
      gold1: "#d4af37",
      gold2: "#7a4d00",
      champagne: "#ffe5aa",
      black: "#040404",
    };

  const balloons = Array.from({ length: 12 }).map((_, i) => ({
  x: Math.random() * w,
  y: -200 - Math.random() * h,
  speed: 1.05 + Math.random() * 1.35,
  sway: 55 + Math.random() * 95,
  phase: Math.random() * 10,
  scale: 0.82 + Math.random() * 0.45,
      color:
  i % 5 === 0
    ? ["#ff2f45", "#9b0010"] // rojo fuerte
    : i % 5 === 1
    ? ["#ffd229", "#b98500"] // amarillo/dorado vivo
    : i % 5 === 2
    ? ["#9b5cff", "#4b1596"] // lila fuerte
    : i % 5 === 3
    ? ["#00d084", "#006b46"] // verde elegante
    : ["#00b7ff", "#005b9a"], // azul brillante
      layer: Math.random(),
    }));

   const confetti = Array.from({ length: 140 }).map(() => ({
      x: Math.random() * w,
      y: -50 - Math.random() * h,
      size: 3 + Math.random() * 8,
      speed: 0.7 + Math.random() * 1.4,
      drift: -0.5 + Math.random() * 1,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: -0.04 + Math.random() * 0.08,
      color: [colors.red1, colors.gold1, colors.champagne, "#b8872f"][
        Math.floor(Math.random() * 4)
      ],
      alpha: 0.35 + Math.random() * 0.4,
    }));

    const goldOrbs = Array.from({ length: 18 }).map(() => ({
  x: Math.random() * w,
  y: Math.random() * h,
  r: 2 + Math.random() * 5,
  speed: 0.08 + Math.random() * 0.18,
  pulse: Math.random() * Math.PI * 2,
  alpha: 0.18 + Math.random() * 0.28,
}));

    const dust = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.5 + Math.random() * 1.8,
      speed: 0.04 + Math.random() * 0.16,
      alpha: 0.15 + Math.random() * 0.35,
      color: Math.random() > 0.45 ? colors.gold1 : colors.champagne,
    }));
const fireBursts = Array.from({ length: 5 }).map((_, i) => ({
  x: i % 2 === 0 ? 90 + Math.random() * w * 0.25 : w - 90 - Math.random() * w * 0.25,
  y: 70 + Math.random() * h * 0.2,
  phase: Math.random(),
  color: ["#ffd229", "#ff2f45", "#9b5cff", "#00d084", "#00b7ff"][i % 5],
}));
    const drawBalloon = (b: any, t: number) => {
  const x = b.x + Math.sin(t / 850 + b.phase) * b.sway;
  const y = b.y;
  const scale = b.scale;
  const angle = Math.sin(t / 1300 + b.phase) * 0.045;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const grad = ctx.createRadialGradient(-18, -24, 18, 6, 6, 78);
  grad.addColorStop(0, b.color[0]);
  grad.addColorStop(0.55, b.color[0]);
  grad.addColorStop(1, b.color[1]);

  ctx.shadowBlur = 18;
  ctx.shadowColor = b.color[0];
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  const sideShade = ctx.createLinearGradient(-48, 0, 48, 0);
  sideShade.addColorStop(0, "rgba(0,0,0,.18)");
  sideShade.addColorStop(0.5, "rgba(255,255,255,0)");
  sideShade.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = sideShade;
  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.ellipse(-18, -26, 9, 22, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = b.color[1];
  ctx.beginPath();
  ctx.moveTo(-7, 54);
  ctx.lineTo(7, 54);
  ctx.lineTo(0, 68);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,220,170,.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 66);
  ctx.bezierCurveTo(-8, 98, 10, 130, -3, 164);
  ctx.stroke();

  ctx.restore();
};

const drawFireBurst = (f: any, t: number) => {
  const cycle = ((t / 2600 + f.phase) % 1);
  if (cycle > 0.72) return;

  const alpha = 1 - cycle / 0.72;
  const radius = 10 + cycle * 90;

  ctx.save();

  for (let i = 0; i < 36; i++) {
    const angle = (Math.PI * 2 * i) / 36;
    const distance = radius * (0.55 + (i % 5) * 0.08);
    const x = f.x + Math.cos(angle) * distance;
    const y = f.y + Math.sin(angle) * distance;

    ctx.globalAlpha = alpha * 0.75;
    ctx.shadowBlur = 16;
    ctx.shadowColor = f.color;
    ctx.fillStyle = f.color;

    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = colors.black;
      ctx.fillRect(0, 0, w, h);

      const vignette = ctx.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, w * 0.75);
      vignette.addColorStop(0, "rgba(255,255,255,0.018)");
      vignette.addColorStop(0.62, "rgba(0,0,0,0.05)");
      vignette.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      dust.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

   fireBursts.forEach((f) => {
  drawFireBurst(f, t);
});

      goldOrbs.forEach((o) => {
  o.y -= o.speed;

  if (o.y < -20) {
    o.y = h + 20;
    o.x = Math.random() * w;
  }

  const pulse = 0.6 + Math.sin(t / 900 + o.pulse) * 0.35;

  ctx.save();
  ctx.globalAlpha = o.alpha * pulse;
  ctx.shadowBlur = 22;
  ctx.shadowColor = "#d4af37";
  ctx.fillStyle = "#d4af37";
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

      balloons.forEach((b) => {
        b.y += b.speed;

        if (b.y > h + 260) {
          b.y = -240 - Math.random() * 420;
          b.x = Math.random() * w;
          b.speed = 0.9 + Math.random() * 1.25;
          b.scale = 0.55 + Math.random() * 0.55;
        }

        drawBalloon(b, t);
      });

      confetti.forEach((c) => {
        c.y += c.speed;
        c.x += c.drift;
        c.rot += c.rotSpeed;

        if (c.y > h + 50) {
          c.y = -50 - Math.random() * 120;
          c.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = Math.min(1, c.alpha + 0.15);
ctx.shadowBlur = 5;
ctx.shadowColor = c.color;
        ctx.fillStyle = c.color;
       ctx.fillRect(
  -c.size / 2,
  -c.size / 2.2,
  c.size,
  c.size * 0.72
);
        ctx.restore();
      });

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
  const [showStart, setShowStart] = useState(true);

  const iniciarFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {}
    setShowStart(false);
  };

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
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 60000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];

  const StartOverlay = (
    <Box
      onClick={iniciarFullscreen}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 99,
        bgcolor: "rgba(0,0,0,0.86)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Typography
        sx={{
          color: "#fff",
          fontSize: "5vw",
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        ▶ Iniciar Presentación
      </Typography>
    </Box>
  );

  if (!current) {
    return (
      <Box sx={{ width: "100vw", height: "100vh", bgcolor: "#000", position: "relative" }}>
        {showStart && StartOverlay}
      </Box>
    );
  }

  const cumple = current as TvBirthday;

  return (
    <Box sx={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", bgcolor: "#030303" }}>
      <LuxuryCanvas />

      {showStart && StartOverlay}

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
          transform: "translateY(-1.2vh)",
        }}
      >
        <Typography
          sx={{
            fontSize: "5.15vw",
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
            fontSize: cumple.nombre.length > 14 ? "7.1vw" : "8.7vw",
            fontWeight: 950,
            lineHeight: 0.92,
            textTransform: "uppercase",
            letterSpacing: ".065em",
            background:
              "linear-gradient(180deg,#ffffff 0%,#f5f5f5 35%,#b7b7b7 58%,#ffffff 82%,#d8d8d8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter:
              "drop-shadow(0 18px 35px rgba(0,0,0,.95)) drop-shadow(0 0 22px rgba(255,255,255,.26))",
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