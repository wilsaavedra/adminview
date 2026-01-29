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
  height = 220,
  emptyLabel = "Sin datos",
}: {
  data: SeriePoint[];
  height?: number;
  emptyLabel?: string;
}) {
   // ✅ más margen izquierdo para que NO se corten los números del eje Y
  const paddingLeft = 78;
  const padding = 28; // mantenemos tu padding para top/bottom/right
  const width = 1000;

  // base data (placeholder si no hay data)
  const baseData: SeriePoint[] =
    data && data.length > 0
      ? data
      : [
          { x: "—", y: 0 },
          { x: "—", y: 0 },
          { x: "—", y: 0 },
        ];

  // ✅ si hay 1 solo punto: armamos 0 -> valor -> 0 (como tu ejemplo)
  const safeData: SeriePoint[] = (() => {
    if (!data || data.length !== 1) return baseData;

    const only = data[0];
    const h = Number(String(only.x).slice(0, 2)); // "01:00" -> 1
    if (Number.isFinite(h)) {
      const prev = String((h + 23) % 24).padStart(2, "0") + ":00";
      const next = String((h + 1) % 24).padStart(2, "0") + ":00";
      return [
        { x: prev, y: 0 },
        { x: only.x, y: only.y },
        { x: next, y: 0 },
      ];
    }

    // fallback si x no es hora
    return [
      { x: "—", y: 0 },
      { x: only.x, y: only.y },
      { x: "—", y: 0 },
    ];
  })();

  const maxY = Math.max(...safeData.map((p) => Number(p.y) || 0), 0);
  const safeMaxY = maxY <= 0 ? 1 : maxY;

  // ticks "bonitos" para eje Y (Bs)
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

  // 5 ticks: 0..top
  const yLabels = Array.from({ length: 5 }, (_, i) => i * step);

  // ✅ NUMÉRICO Bs (si quieres 0 decimales usa toFixed(0))
  const formatBs = (v: number) => `${v.toFixed(0)} Bs`;

  // área interna del chart (ya con margen izquierdo real)
  const innerW = width - paddingLeft - padding;
  const innerH = height - padding * 2;

  const points = safeData.map((p, i) => {
    const x =
      paddingLeft +
      (i * innerW) / Math.max(1, safeData.length - 1);

    const y =
      height - padding - ((Number(p.y) || 0) * innerH) / (top || 1);

    return { x, y, label: p.x, value: Number(p.y) || 0 };
  });

  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  // ya NO usamos gridLines 0.25.. porque ahora el grid lo hacen yLabels (mejor)
  const isEmpty = !data || data.length === 0;

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        component="svg"
        viewBox={`0 0 ${width} ${height}`}
        sx={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.06)",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.015), rgba(0,0,0,0.00))",
        }}
      >
        {/* fondo */}
        <rect x="0" y="0" width={width} height={height} fill="#fff" />

       {/* ✅ grid + labels eje Y (Bs) */}
      {yLabels.map((val, idx) => {
        const y =
          height - padding - (val * (height - padding * 2)) / (top || 1);

        return (
          <g key={idx}>
            {/* línea de grid */}
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />

            {/* label Bs (ya NO se corta) */}
            <text
              x={paddingLeft - 12}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="rgba(0,0,0,0.55)"
            >
              {formatBs(val)}
            </text>
          </g>
        );
      })}

      {/* eje Y */}
      <line
        x1={paddingLeft}
        y1={padding}
        x2={paddingLeft}
        y2={height - padding}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
      />

      {/* eje x */}
      <line
        x1={paddingLeft}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
      />

        {/* línea */}
        <path
          d={pathD}
          fill="none"
          stroke={isEmpty ? "rgba(0,0,0,0.25)" : "rgb(225,63,68)"}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* puntos */}
        {points.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill="#fff"
            stroke={isEmpty ? "rgba(0,0,0,0.25)" : "rgb(225,63,68)"}
            strokeWidth="2"
          />
        ))}

        {/* labels X */}
        {points.map((pt, idx) => {
          const step = points.length <= 8 ? 1 : Math.ceil(points.length / 6);
          if (idx % step !== 0 && idx !== points.length - 1) return null;

          return (
            <text
              key={idx}
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="12"
              fill="rgba(0,0,0,0.55)"
            >
              {pt.label}
            </text>
          );
        })}

        {/* overlay sin datos */}
        {isEmpty && (
          <>
            <rect
              x={padding}
              y={padding}
              width={width - padding * 2}
              height={height - padding * 2}
              fill="rgba(255,255,255,0.55)"
            />
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              fontSize="14"
              fill="rgba(0,0,0,0.6)"
              style={{ fontWeight: 800 }}
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
  return (
   <Card
    sx={{
      height: "100%",
      borderRadius: "18px",
      boxShadow: 1,
      overflow: "hidden",
    }}
  >
      <Box
        sx={{
          px: 2,
          py: 1.2,
          background: headerBg,
          color: "#fff",
        }}
      >
        <Typography sx={{ fontWeight: 950, fontSize: 15 }}>{title}</Typography>
      </Box>

      <CardContent sx={{ pt: 1.8 }}>
      <Typography
            sx={{
                color: "rgba(0,0,0,0.6)",
                fontSize: 13,
                mb: 1,
                display: { xs: "none", sm: "block" }, // 👈 móvil fuera
            }}
            >
            {subtitle}
            </Typography>

 <Grid container spacing={0} alignItems="baseline">
  {/* CANTIDAD (izquierda) */}
  <Grid size={{ xs: 6 }} sx={{ textAlign: "left" }}>
    <Typography
      sx={{
        fontSize: 26,
        fontWeight: 950,
        lineHeight: 1.05,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.3px",
      }}
    >
      {count}
    </Typography>

    <Typography sx={{ color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
      Cuentas
    </Typography>
  </Grid>

  {/* IMPORTE (derecha) */}
  <Grid
    size={{ xs: 6 }}
    sx={{
      textAlign: "right",
    }}
  >
    {typeof amount === "number" ? (
      <>
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 34 },
            fontWeight: 950,
            lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.6px",
            whiteSpace: "nowrap", // ✅ clave: no se parte y mantiene look “pro”
          }}
        >
          {amount.toFixed(2)}{" "}
          <Box
            component="span"
            sx={{
              fontSize: { xs: 14, sm: 18 },
              fontWeight: 900,
            }}
          >
            Bs
          </Box>
        </Typography>

        <Typography sx={{ color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
          Importe
        </Typography>
      </>
    ) : (
      <>
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 34 },
            fontWeight: 950,
            lineHeight: 1.05,
            whiteSpace: "nowrap",
          }}
        >
          —
        </Typography>
        <Typography sx={{ color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
          Importe
        </Typography>
      </>
    )}
  </Grid>
</Grid>
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

          <Typography sx={{ mt: 1.5, color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
            Eje Y: monto cobrado (Bs) · Eje X: {periodo === "dia" ? "horas" : "días"}
          </Typography>
        </CardContent>
      </Card>

      {/* KPIs (como el ejemplo: cards con header color) */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Cuentas abiertas"
            subtitle="Estado distinto de pagado"
            count={data?.cuentasAbiertas?.cantidad ?? 0}
            amount={data?.cuentasAbiertas?.monto ?? 0}
            headerBg="linear-gradient(90deg, #6F42C1, #7E57C2)"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Cuentas cerradas"
            subtitle="Pagadas / cerradas totalmente"
            count={data?.cuentasCerradas?.cantidad ?? 0}
            amount={data?.cuentasCerradas?.monto ?? 0}
            headerBg="linear-gradient(90deg, #E91E63, #D81B60)"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card
  sx={{
    height: "100%",
    borderRadius: "18px",
    boxShadow: 1,
    overflow: "hidden",
  }}
>
            <Box
              sx={{
                px: 2,
                py: 1.2,
                background: "linear-gradient(90deg, #263238, #37474F)",
                color: "#fff",
              }}
            >
              <Typography sx={{ fontWeight: 950, fontSize: 15 }}>
                Clientes atendidos
              </Typography>
            </Box>

 <CardContent sx={{ pt: 1.8 }}>
  <Typography sx={{ color: "rgba(0,0,0,0.6)", fontSize: 13, mb: 1 }}>
    Total del periodo
  </Typography>

  <Typography
    sx={{
      fontSize: 26,
      fontWeight: 950,
      lineHeight: 1.05,
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-0.3px",
    }}
  >
    {data?.clientesAtendidos ?? 0}
  </Typography>

  <Typography sx={{ color: "rgba(0,0,0,0.55)", fontSize: 12, mt: 0.5 }}>
    Clientes
  </Typography>
</CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}