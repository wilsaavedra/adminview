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
  const padding = 28;
  const width = 1000;

  const safeData =
    data && data.length > 0
      ? data
      : [
          { x: "—", y: 0 },
          { x: "—", y: 0 },
          { x: "—", y: 0 },
        ];

  const maxY = Math.max(...safeData.map((p) => p.y), 0);
  const safeMaxY = maxY <= 0 ? 1 : maxY;

  const points = safeData.map((p, i) => {
    const x =
      padding +
      (i * (width - padding * 2)) / Math.max(1, safeData.length - 1);
    const y =
      height - padding - (p.y * (height - padding * 2)) / safeMaxY;
    return { x, y, label: p.x, value: p.y };
  });

  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const gridLines = [0.25, 0.5, 0.75].map((t) => {
    const y = height - padding - t * (height - padding * 2);
    return y;
  });

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

        {/* grid */}
        {gridLines.map((y, idx) => (
          <line
            key={idx}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* eje x */}
        <line
          x1={padding}
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
    <Card sx={{ borderRadius: "18px", boxShadow: 1, overflow: "hidden" }}>
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
        <Typography sx={{ color: "rgba(0,0,0,0.6)", fontSize: 13, mb: 1 }}>
          {subtitle}
        </Typography>

        <Grid container spacing={1} alignItems="baseline">
           <Grid size={{ xs: 6 }}>
            <Typography sx={{ fontSize: 34, fontWeight: 950, lineHeight: 1 }}>
              {count}
            </Typography>
            <Typography sx={{ color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
              Cuentas
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            {typeof amount === "number" ? (
              <>
                <Typography sx={{ fontSize: 18, fontWeight: 950 }}>
                  {amount.toFixed(2)} Bs
                </Typography>
                <Typography sx={{ color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
                  Importe
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: 18, fontWeight: 950 }}>—</Typography>
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

  const serie = data?.serie ?? [];

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 950, mb: 0.5 }}>
        Reportes · Resumen
      </Typography>
      <Typography sx={{ color: "rgba(0,0,0,0.6)", mb: 2 }}>
        Vista general de ventas y actividad por periodo.
      </Typography>

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
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
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

                    <Grid size={{ xs: 12, sm: 6 }}>
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
          <Card sx={{ borderRadius: "18px", boxShadow: 1, overflow: "hidden" }}>
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
              <Typography sx={{ fontSize: 34, fontWeight: 950, lineHeight: 1 }}>
                {data?.clientesAtendidos ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}