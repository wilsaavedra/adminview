import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import cafeApi from "../api/cafeApi";

type Periodo = "dia" | "personalizado";

type SeriePoint = {
  x: string; // "18:00" o "2026-01-28"
  y: number; // monto cobrado
};

type ResumenResponse = {
  periodo: Periodo;
  serie: SeriePoint[];
  cuentasAbiertas: { cantidad: number; monto: number };
  cuentasCerradas: { cantidad: number; monto: number };
  clientesAtendidos: number;
};

function ymdLaPaz(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Chart SVG simple (sin librerías). Siempre dibuja algo:
 * - si no hay data => placeholder con 3 puntos en 0
 */
function SimpleLineChart({
  data,
  height = 190, // desktop
  emptyLabel = "Sin datos",
}: {
  data: SeriePoint[];
  height?: number;
  emptyLabel?: string;
}) {
  // ✅ Detecta móvil SIN imports
  const isMobile =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width:600px)").matches
      : false;

  // ✅ En móvil le damos más alto para que se lea mejor
  const h = isMobile ? 290 : height;

    // ✅ En móvil el SVG se reduce mucho (viewBox 1000px -> pantalla),
  // así que los textos deben ser MUCHO más grandes en unidades del viewBox.
  const yTickFont = isMobile ? 34 : 12;
  const xTickFont = isMobile ? 30 : 11;
  const axisFont  = isMobile ? 30 : 11;
  const emptyFont = isMobile ? 34 : 14;

  // ✅ Más aire en móvil para que entren labels grandes
 const paddingLeft = isMobile ? 132 : 74;
const padding = isMobile ? 30 : 22;

  // ✅ NUEVO: paddings separados para evitar que se pisen ticks y títulos
  const padTop = isMobile ? 26 : padding;
  const padBottom = isMobile ? 74 : 34;

  const width = 1000;

  const xAxisTitle =
  data && data.length > 0 && data[0].x.includes(":")
    ? "Horas"
    : "Días";
  const yAxisTitle = "Total Ventas";

  const baseData: SeriePoint[] =
    data && data.length > 0
      ? data
      : [
          { x: "—", y: 0 },
          { x: "—", y: 0 },
          { x: "—", y: 0 },
        ];

  const safeData: SeriePoint[] = (() => {
    if (!data || data.length !== 1) return baseData;

    const only = data[0];
    const h = Number(String(only.x).slice(0, 2));
    if (Number.isFinite(h)) {
      const prev = String((h + 23) % 24).padStart(2, "0") + ":00";
      const next = String((h + 1) % 24).padStart(2, "0") + ":00";
      return [
        { x: prev, y: 0 },
        { x: only.x, y: only.y },
        { x: next, y: 0 },
      ];
    }

    return [
      { x: "—", y: 0 },
      { x: only.x, y: only.y },
      { x: "—", y: 0 },
    ];
  })();

  const maxY = Math.max(...safeData.map((p) => Number(p.y) || 0), 0);
  const safeMaxY = maxY <= 0 ? 1 : maxY;

  function niceStep(max: number, ticks = 4) {
    if (max <= 0) return 1;
    const rough = max / ticks;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const n = rough / pow;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return nice * pow;
  }

  const step = niceStep(safeMaxY, 4);
  const top = Math.ceil(safeMaxY / step) * step;

  const yLabels = Array.from({ length: 5 }, (_, i) => i * step);

  const formatBs = (v: number) => `${v.toFixed(0)} Bs`;

  const innerW = width - paddingLeft - padding;
const innerH = h - padTop - padBottom;

const points = safeData.map((p, i) => {
  const x = paddingLeft + (i * innerW) / Math.max(1, safeData.length - 1);
  const y = h - padBottom - ((Number(p.y) || 0) * innerH) / (top || 1);
  return { x, y, label: p.x, value: Number(p.y) || 0 };
});

  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const isEmpty = !data || data.length === 0;

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        component="svg"
       viewBox={`0 0 ${width} ${h}`}
        sx={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        <rect x="0" y="0" width={width} height={height} fill="#fff" />

        {/* grid + labels eje Y */}
       {yLabels.map((val, idx) => {
  const y =
    h - padBottom - (val * (h - padTop - padBottom)) / (top || 1);

  return (
    <g key={idx}>
      <line
        x1={paddingLeft}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
      <text
        x={paddingLeft - 12}
        y={y + 5}
        textAnchor="end"
        fontSize={yTickFont}
        fill="rgba(0,0,0,0.55)"
      >
        {formatBs(val)}
      </text>
    </g>
  );
})}

        {/* ejes */}
     <line
  x1={paddingLeft}
  y1={padTop}
  x2={paddingLeft}
  y2={h - padBottom}
  stroke="rgba(0,0,0,0.12)"
  strokeWidth="1"
/>

<line
  x1={paddingLeft}
  y1={h - padBottom}
  x2={width - padding}
  y2={h - padBottom}
  stroke="rgba(0,0,0,0.12)"
  strokeWidth="1"
/>

        {/* línea */}
        <path
          d={pathD}
          fill="none"
          stroke={isEmpty ? "rgba(0,0,0,0.25)" : "rgb(225,63,68)"}
          strokeWidth={isMobile ? 4 : 3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* puntos */}
        {points.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={isMobile ? 5 : 4}
            fill="#fff"
            stroke={isEmpty ? "rgba(0,0,0,0.25)" : "rgb(225,63,68)"}
            strokeWidth={isMobile ? 3 : 2}
          />
        ))}

       {/* labels X */}
{points.map((pt, idx) => {
  const stepX = points.length <= 8 ? 1 : Math.ceil(points.length / 6);
  if (idx % stepX !== 0 && idx !== points.length - 1) return null;

  const formatXLabel = (raw: string) => {
    // Hora: "01:00" => "1"
    const mHour = /^(\d{2}):\d{2}$/.exec(raw);
    if (mHour) return String(Number(mHour[1]));

    // Día: "YYYY-MM-DD" => "DD/MM"
    const mDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (mDay) return `${mDay[3]}/${mDay[2]}`;

    return raw;
  };

  return (
    <text
      key={idx}
      x={pt.x}
      y={h - padBottom + (isMobile ? 38 : 22)}
      textAnchor="middle"
      fontSize={xTickFont}
      fill="rgba(0,0,0,0.55)"
    >
      {formatXLabel(pt.label)}
    </text>
  );
})}

        {/* título eje X */}
       <text
            x={(paddingLeft + (width - padding)) / 2}
            y={h - (isMobile ? 2 : 0)}  // ✅ más pegado al borde inferior, ya no se choca con los ticks
            textAnchor="middle"
            fontSize={axisFont}
            fill="rgba(0,0,0,0.55)"
            style={{ fontWeight: 800 }}
            >
            {xAxisTitle}
            </text>

        {/* título eje Y */}
      <text
        x={isMobile ? 20 : 16}
        y={(padTop + (h - padBottom)) / 2}
        textAnchor="middle"
        fontSize={axisFont}
        fill="rgba(0,0,0,0.55)"
        style={{ fontWeight: 800 }}
        transform={`rotate(-90 ${isMobile ? 20 : 16} ${(padTop + (h - padBottom)) / 2})`}
        >
        {yAxisTitle}
        </text>

        {/* overlay sin datos */}
        {isEmpty && (
          <>
            <rect
              x={padding}
              y={padding}
              width={width - padding * 2}
              height={h - padding * 2}
              fill="rgba(255,255,255,0.55)"
            />
            <text
              x={width / 2}
              y={h / 2}
              textAnchor="middle"
              fontSize={emptyFont}
              fill="rgba(0,0,0,0.6)"
              style={{ fontWeight: 900 }}
            >
              {emptyLabel}
            </text>
          </>
        )}
      </Box>
    </Box>
  );
}

function KpiCard({
  title,
  subtitle,
  count,
  amount,
  headerBg,
}: {
  title: string;
  subtitle: string;
  count: number;
  amount?: number;
  headerBg: string;
}) {
  const hasAmount = typeof amount === "number";

  const accentColor =
    title.toLowerCase().includes("abiertas") ? "#6F42C1" : "#E91E63";

  const amountColor = "#2E7D32";

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "14px",
        boxShadow: 1,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 0.9,
          background: headerBg,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
          {title}
        </Typography>
      </Box>

      <CardContent sx={{ pt: 0.7, pb: 0.7, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13, color: accentColor }}>
            Cuentas
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: accentColor }}>
            Importe
            </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
  <Typography
  sx={{
    fontSize: { xs: 19, sm: 21 },
    fontWeight: 500,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    lineHeight: 1.05,
    // 👇 en vez de color puro, baja el contraste (se ve menos “bold” en iPhone)
    color: "rgba(111,66,193,0.85)", // para “abiertas” (morado)
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.2px",
  }}
>
  {count}
</Typography>

       <Typography
            sx={{
                fontSize: { xs: 19, sm: 21 },
                fontWeight: 500,
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                lineHeight: 1.05,
                // 👇 MISMA lógica que count: baja contraste para que no “grite”
                color: hasAmount ? "rgba(46,125,50,0.85)" : "rgba(0,0,0,0.35)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
            }}
            >
            {hasAmount ? amount!.toFixed(2) : "—"}
            </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ReporteResumen() {
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [fechaDia, setFechaDia] = useState<Date | null>(new Date());
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResumenResponse | null>(null);

  const params = useMemo(() => {
    if (periodo === "dia") {
      return {
        periodo: "dia",
        fecha: fechaDia ? ymdLaPaz(fechaDia) : ymdLaPaz(new Date()),
      };
    }
    return {
      periodo: "personalizado",
      inicio: fechaInicio ? ymdLaPaz(fechaInicio) : ymdLaPaz(new Date()),
      fin: fechaFin ? ymdLaPaz(fechaFin) : ymdLaPaz(new Date()),
    };
  }, [periodo, fechaDia, fechaInicio, fechaFin]);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await cafeApi.get("/reportes/resumen", { params });
      setData(resp.data?.data ?? resp.data);
    } catch (e: any) {
  console.error("❌ Error GET /reportes/resumen:", {
    message: e?.message,
    status: e?.response?.status,
    data: e?.response?.data,
    params,
  });

  // Para que no se vea vacío feo:
  setData({
    periodo,
    serie: [],
    cuentasAbiertas: { cantidad: 0, monto: 0 },
    cuentasCerradas: { cantidad: 0, monto: 0 },
    clientesAtendidos: 0,
  });
} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.periodo, (params as any).fecha, (params as any).inicio, (params as any).fin]);

  const serieRaw = data?.serie ?? [];

function fillHoras(serie: SeriePoint[]) {
  // Espera formato "HH:00" en x (ej: "01:00")
  const toH = (s: string) => {
    const m = /^(\d{2}):/.exec(s);
    return m ? Number(m[1]) : null;
  };

  const horas = serie
    .map(p => toH(p.x))
    .filter((h): h is number => h !== null);

  if (horas.length === 0) return serie;

  const minH = Math.min(...horas);
  const maxH = Math.max(...horas);

  const map = new Map(serie.map(p => [p.x, p.y]));

  const out: SeriePoint[] = [];
  for (let h = minH; h <= maxH; h++) {
    const label = String(h).padStart(2, "0") + ":00";
    out.push({ x: label, y: map.get(label) ?? 0 });
  }
  return out;
}

function fillDias(
  serie: SeriePoint[],
  inicio: string,
  fin: string
) {
  const map = new Map(serie.map(p => [p.x, p.y]));

  const out: SeriePoint[] = [];
  let cur = new Date(inicio + "T00:00:00");
  const end = new Date(fin + "T00:00:00");

  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10); // YYYY-MM-DD
    out.push({
      x: key,
      y: map.get(key) ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return out;
}

const serie =
  periodo === "dia"
    ? fillHoras(serieRaw)
    : fillDias(
        serieRaw,
        params.inicio ?? ymdLaPaz(new Date()),
        params.fin ?? ymdLaPaz(new Date())
      );

  return (
    <Box sx={{ width: "100%" }}>
     <Box
            sx={{
                mt: { xs: 6, sm: 0 }, // 👈 baja el título SOLO en móvil
            }}
            >
            <Typography variant="h5" sx={{ fontWeight: 950, mb: 0.5 }}>
                Reportes · Resumen
            </Typography>

           <Typography
                sx={{
                    color: "rgba(0,0,0,0.6)",
                    mb: 2,
                    display: { xs: "none", sm: "block" }, // 👈 oculto en móvil
                }}
                >
                Vista general de ventas y actividad por periodo.
                </Typography>
            </Box>

      {/* Filtros (estilo limpio + botón) */}
      <Card
        sx={{
          borderRadius: "18px",
          boxShadow: 1,
          mb: 2,
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography sx={{ fontWeight: 950, mb: 0.8 }}>Periodo</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Periodo</InputLabel>
                <Select
                  label="Periodo"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as Periodo)}
                  sx={{
                    borderRadius: "12px",
                    bgcolor: "#fff",
                    boxShadow: 1,
                  }}
                >
                  <MenuItem value="dia">Día</MenuItem>
                  <MenuItem value="personalizado">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            {periodo === "dia" ? (
  <>
    <Typography sx={{ fontWeight: 950, mb: 0.8 }}>Fecha</Typography>

    <Box
      sx={{
        width: { xs: "100%", md: 360 },
        maxWidth: "100%",
      }}
    >
      <DatePicker
        value={fechaDia}
        onChange={(v) => setFechaDia(v)}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            sx: {
              bgcolor: "white",
              borderRadius: "12px",
              boxShadow: 1,
            },
          },
        }}
      />
    </Box>
  </>
) : (
               <Grid container spacing={2} alignItems="stretch">
  <Grid size={{ xs: 6, sm: 6 }}>
    <Typography sx={{ fontWeight: 950, mb: 0.8 }}>
      Fecha inicio
    </Typography>
    <DatePicker
      value={fechaInicio}
      onChange={(v) => setFechaInicio(v)}
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
          sx: {
            bgcolor: "white",
            borderRadius: "12px",
            boxShadow: 1,
          },
        },
      }}
    />
  </Grid>

  <Grid size={{ xs: 6, sm: 6 }}>
    <Typography sx={{ fontWeight: 950, mb: 0.8 }}>
      Fecha fin
    </Typography>
    <DatePicker
      value={fechaFin}
      onChange={(v) => setFechaFin(v)}
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
          sx: {
            bgcolor: "white",
            borderRadius: "12px",
            boxShadow: 1,
          },
        },
      }}
    />
  </Grid>
</Grid>
                )}
              </LocalizationProvider>
            </Grid>

           <Grid size={{ xs: 12, sm: 2 }}>
              <Typography sx={{ fontWeight: 950, mb: 0.8, opacity: 0 }}>
                .
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={cargar}
                disabled={loading}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 950,
                  height: 40,
                  backgroundColor: "#7CB342", // verde tipo “Actualizar”
                  "&:hover": { backgroundColor: "#689F38" },
                }}
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Gráfico */}
      <Card
        sx={{
          borderRadius: "18px",
          boxShadow: 1,
          mb: 2,
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 950 }}>
              {periodo === "dia" ? "Cuentas cerradas por hora" : "Cuentas cerradas por día"}
            </Typography>
            {loading && <CircularProgress size={18} />}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <SimpleLineChart
            data={serie}
            emptyLabel="No hay datos para el periodo seleccionado"
          />

      
        </CardContent>
      </Card>

      {/* KPIs (como el ejemplo: cards con header color) */}
 {/* KPIs principales */}
<Grid container spacing={1.4}>
  <Grid size={{ xs: 12, md: 4 }}>
    <KpiCard
      title="Cuentas abiertas"
      subtitle="Estado distinto de pagado"
      count={data?.cuentasAbiertas?.cantidad ?? 0}
      amount={data?.cuentasAbiertas?.monto ?? 0}
      headerBg="#6F42C1"
    />
  </Grid>

  <Grid size={{ xs: 12, md: 4 }}>
    <KpiCard
      title="Cuentas cerradas"
      subtitle="Pagadas / cerradas totalmente"
      count={data?.cuentasCerradas?.cantidad ?? 0}
      amount={data?.cuentasCerradas?.monto ?? 0}
      headerBg="#E91E63"
    />
  </Grid>
</Grid>

{/* ✅ Clientes atendidos (fila debajo) – MISMO ancho que un KPI (md:4) y centrado */}
<Grid
  container
  spacing={1.4}
  sx={{ mt: 1 }}
  justifyContent="flex-start"   // ✅ antes "center"
>
  <Grid size={{ xs: 12, md: 4 }}>
    <Card
      sx={{
        height: "100%",
        borderRadius: "14px",
        boxShadow: "none",
        bgcolor: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <CardContent sx={{ px: 2, py: 1.1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                bgcolor: "rgba(25,118,210,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PeopleAltIcon sx={{ fontSize: 18, color: "rgba(25,118,210,0.85)" }} />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 12, // ✅ si lo quieres igual a labels de KPI
                color: "rgba(0,0,0,0.60)",
              }}
            >
              Clientes atendidos
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: { xs: 16, sm: 18 }, // ✅ antes 20/22 (más chico)
              fontWeight: 800,
              lineHeight: 1.05,
              color: "rgba(0,0,0,0.55)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            ({data?.clientesAtendidos ?? 0})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  </Grid>
</Grid>
    </Box>
  );
}