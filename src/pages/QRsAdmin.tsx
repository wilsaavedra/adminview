import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { es } from "date-fns/locale";
import RefreshIcon from "@mui/icons-material/Refresh";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
});

type EstadoPago = "pendiente" | "pagado" | "expirado" | "error";

type Reserva = {
  _id: string;
  nombre: string;
  fecha: string;
  mesa?: number;
};

type Pago = {
  _id: string;
  reserva: Reserva | string;
  montoTotal: number;
  montoPagado: number;
  estado: EstadoPago;
  fechaPago?: string;
  fechaCreacion: string;
  fechaExpiracion?: string;
  qrImage?: string;
};

const ymdLaPaz = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const formatHoraLaPaz = (iso: string) =>
  new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/La_Paz",
  }).format(new Date(iso));

export default function QRsAdmin() {
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal generar QR
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState<string>("");
  const [reservasDia, setReservasDia] = useState<Reserva[]>([]);
  const [reservaId, setReservaId] = useState<string>("");
  const [genLoading, setGenLoading] = useState(false);
  const [qrGenerado, setQrGenerado] = useState<{ qrImage: string; pagoId: string } | null>(null);

  const tituloFecha = useMemo(() => {
    if (!fecha) return "";
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/La_Paz",
    }).format(fecha);
  }, [fecha]);

  const fetchReservasDia = async (ymd: string) => {
    // Reusamos tu endpoint /reservas y filtramos por día (como en ReservasPage)
    const resp = await API.get("/reservas");
    const all: any[] = Array.isArray(resp.data.reservas) ? resp.data.reservas : [];
    const filtradas = all
  .filter((r) => ymdLaPaz(new Date(r.fecha)) === ymd)
  .map((r) => ({
    _id: r._id,
    nombre: r.nombre,
    fecha: r.fecha,
    mesa: r.mesa, // 👈 agregado
  }));
    setReservasDia(filtradas);
  };

  const fetchPagos = async () => {
    if (!fecha) return;
    const ymd = ymdLaPaz(fecha);

    try {
      setLoading(true);
      setError(null);

      const resp = await API.get(`/pagos/por-fecha/${ymd}`);
      const data: Pago[] = Array.isArray(resp.data.pagos) ? resp.data.pagos : [];
      setPagos(data);

      // precargar reservas del día para el modal
      await fetchReservasDia(ymd);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar los QRs del día.");
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

// 🔄 Actualizar estados consultando primero al banco
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await API.post("/pagos/sincronizar"); // 👈 pregunta al BNB
      await fetchPagos();                   // 👈 recarga la tabla
    } catch (err) {
      console.error("Error sincronizando pagos", err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial / cambio de fecha
  useEffect(() => {
    fetchPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  

  const estadoUI = (estado: EstadoPago) => {
  if (estado === "pagado") {
    return {
      text: "Realizado",
      icon: <CheckCircleIcon sx={{ mr: 1, color: "#2e7d32" }} />, // verde
    };
  }

  if (estado === "expirado") {
    return {
      text: "Expirado",
      icon: <CancelIcon sx={{ mr: 1, color: "#d32f2f" }} />, // rojo
    };
  }

  return {
    text: "Pendiente",
    icon: <HourglassEmptyIcon sx={{ mr: 1, color: "#ed6c02" }} />, // naranja
  };
};

  const handleOpenModal = () => {
    setMonto("");
    setReservaId("");
    setQrGenerado(null);
    setOpen(true);
  };

  const buildImgSrc = (qr: string) => {
    // si ya viene con data:image, lo respetamos
    if (qr.startsWith("data:image")) return qr;
    return `data:image/png;base64,${qr}`;
  };

  const generarQR = async () => {
    const montoNum = Number(monto);
    if (!reservaId) return;
    if (!monto || isNaN(montoNum) || montoNum <= 0) return;

    try {
      setGenLoading(true);

      // Usamos tu endpoint REAL: POST /pagos/crear
      const resp = await API.post("/pagos/crear", {
        reservaId,
        subtotal: 0,
        costoEnvases: 0,
        descuentoCupon: 0,
        montoTotal: montoNum,
        cuponId: null,
      });

      const pago: Pago = resp.data.pago;
      const qrImage: string = resp.data.qrImage;

      setQrGenerado({ qrImage, pagoId: pago._id });

      // Cuando se genere, recargamos lista para que aparezca "pendiente"
      await fetchPagos();
    } catch (e) {
      console.error(e);
    } finally {
      setGenLoading(false);
    }
  };

const reservasMap = useMemo(() => {
  const map = new Map<string, Reserva>();
  reservasDia.forEach((r) => map.set(r._id, r));
  return map;
}, [reservasDia]);


  return (
    <Box sx={{ p: 3, width: "100%", bgcolor: "#fff" }}>
      {/* CABECERA */}
 <Grid
  container
  alignItems="center"
  justifyContent="flex-start"
  mb={3}
  sx={{ gap: 3 }}
>
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <DatePicker
        value={fecha}
        onChange={(newValue) => setFecha(newValue)}
        slots={{ openPickerIcon: CalendarTodayIcon }}
        slotProps={{
          textField: {
            size: "small",
            sx: { bgcolor: "white", borderRadius: "12px", boxShadow: 1, minWidth: 170 },
          },
        }}
      />
    </LocalizationProvider>

    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
  <Button
    variant="contained"
    color="error"
    startIcon={<QrCode2Icon />}
    onClick={handleOpenModal}
    sx={{
      height: 40,
      borderRadius: "12px",
      textTransform: "none",
      fontWeight: 600,
    }}
  >
    Generar QR
  </Button>

  <IconButton
    onClick={handleRefresh}
    sx={{
      height: 40,
      width: 40,
      borderRadius: "10px",
      border: "1px solid #ddd",
      bgcolor: "#fff",
      "&:hover": {
        bgcolor: "#f5f5f5",
      },
    }}
  >
    <RefreshIcon />
  </IconButton>
</Box>

  </Box>

  <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
    {tituloFecha}
  </Typography>
</Grid>

      {/* TABLA */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography sx={{ textAlign: "center", mt: 5, color: "red" }}>{error}</Typography>
      ) : pagos.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 5, color: "#777" }}>
          No hay QRs para esta fecha.
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            width: "100%",
            overflowX: "visible",
            overflowY: "visible",
            WebkitOverflowScrolling: "touch",
            boxShadow: "none",
            border: "none",
            display: "block",
          }}
        >
          <Table
            sx={{
              width: "max-content",
              minWidth: 950,
              tableLayout: "auto",
              borderCollapse: "collapse",
              borderSpacing: 0,
              "& th, & td": {
                padding: "10px 8px",
                borderBottom: "1px solid #e0e0e0",
              },
              "& th": {
                fontWeight: 600,
                whiteSpace: "nowrap",
                fontSize: { xs: 12, md: 14 },
              },
              "& td": { fontSize: { xs: 12, md: 14 } },
            }}
          >
            <TableHead sx={{ bgcolor: "rgb(225,63,68)" }}>
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>Reserva</TableCell>
                <TableCell sx={{ color: "#fff" }}>Mesa</TableCell>
                <TableCell sx={{ color: "#fff" }}>Fecha QR</TableCell>
                <TableCell sx={{ color: "#fff" }}>Monto</TableCell>
                <TableCell sx={{ color: "#fff" }}>Monto Pagado</TableCell>
                <TableCell sx={{ color: "#fff" }}>Estado</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pagos.map((p) => {
 const reservaPopulada =
  typeof p.reserva === "string" ? undefined : p.reserva;

const reservaId =
  typeof p.reserva === "string" ? p.reserva : p.reserva?._id;

const reservaDesdeMapa = reservaId
  ? reservasMap.get(reservaId)
  : undefined;

// 👉 prioridad: nombre desde el pago, mesa desde el map
const r: Reserva | undefined = reservaPopulada
  ? { ...reservaPopulada, mesa: reservaDesdeMapa?.mesa }
  : reservaDesdeMapa;
                const estado = estadoUI(p.estado);

                return (
                <TableRow key={p._id} hover>
  {/* Reserva */}
  <TableCell>{r?.nombre || "—"}</TableCell>

  {/* Mesa */}
  <TableCell>
    {r?.mesa ? `Mesa ${r.mesa}` : "—"}
  </TableCell>

  {/* Fecha QR */}
  <TableCell>
    {p.fechaPago
      ? formatHoraLaPaz(p.fechaPago)
      : formatHoraLaPaz(p.fechaCreacion)}
  </TableCell>

  {/* Monto */}
  <TableCell>
    {p.montoTotal?.toFixed?.(2) ?? p.montoTotal} Bs
  </TableCell>

  {/* Monto Pagado */}
  <TableCell>
    {p.montoPagado && p.montoPagado > 0 ? `${p.montoPagado} Bs` : ""}
  </TableCell>

  {/* Estado */}
  <TableCell>
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {estado.icon}
      {estado.text}
    </Box>
  </TableCell>
</TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* MODAL GENERAR QR */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Generar QR
          {/* X solo “usable” después de generar QR (como pediste) */}
          <IconButton
            onClick={() => setOpen(false)}
            disabled={!qrGenerado}
            size="small"
            sx={{ opacity: qrGenerado ? 1 : 0.3 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, mb: 2 }}>
            <Select
              value={reservaId}
              onChange={(e) => setReservaId(e.target.value)}
              size="small"
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>
                Seleccionar reserva del día
              </MenuItem>
             {reservasDia.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                    {r.nombre}
                    {r.mesa && ` — Mesa ${r.mesa}`}
                </MenuItem>
                ))}
            </Select>

            <TextField
              label="Monto (Bs)"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ inputMode: "decimal" }}
            />
          </Box>

          {qrGenerado?.qrImage && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <img
                src={buildImgSrc(qrGenerado.qrImage)}
                alt="QR"
                style={{ width: 260, height: 260, objectFit: "contain" }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
            <Button
                variant="outlined"
                onClick={() => setOpen(false)}
                disabled={genLoading}
                sx={{
                borderColor: "rgb(225,63,68)",
                color: "rgb(225,63,68)",
                "&:hover": {
                    borderColor: "rgb(225,63,68)",
                    backgroundColor: "rgba(225,63,68,0.06)",
                },
                }}
            >
                Cancelar
            </Button>

            <Button
                variant="contained"
                onClick={generarQR}
                disabled={genLoading || !reservaId || !monto || Number(monto) <= 0}
                sx={{
                backgroundColor: "rgb(225,63,68)",
                "&:hover": { backgroundColor: "rgb(200,50,55)" },
                }}
            >
                {genLoading ? "Generando..." : "Generar QR"}
            </Button>
            </DialogActions>
      </Dialog>
    </Box>
  );
}