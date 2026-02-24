import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
   Snackbar,
  Alert,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PaymentsIcon from "@mui/icons-material/Payments";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CreditCardIcon from "@mui/icons-material/CreditCard";

import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

import cafeApi from "../api/cafeApi";
import { useNavigate, useLocation } from "react-router-dom";

// =====================================
//  INTERFAZ MENÚ RESERVA
// =====================================
interface MenuReserva {
  _id: string;
  fecha_creacion?: string;
 productos: {
  producto: { _id: string; precio: number; nombre: string };
  cantidad: number;
}[];
  reserva: {
  _id: string;
  nombre: string;
  telefono: string;
  tipo: string;
  comentarios: string;
  fecha: string;
  pago: number;

  // ✅ NUEVO: descuento guardado en la reserva
  descuentoCupon?: number;

  // ✅ NUEVO: opcional, por si quieres mostrarlo en admin
  cupon?: {
    _id?: string;
    codigo?: string;
    porcentaje?: number;
    usado?: boolean;
    fechaUso?: string;
  };

  // ✅ opcional
  resest?: string;
};
  enviado?: boolean;
  facturado?: boolean;
}

type MetodoPagoCierre = "EFECTIVO" | "TARJETA" | "QR";

export default function MenuReservas() {
  const [reservas, setReservas] = useState<MenuReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const [fecha, setFecha] = useState<Date | null>(
    location.state?.fechaSeleccionada
      ? new Date(location.state.fechaSeleccionada)
      : new Date()
  );
  const [error, setError] = useState<string | null>(null);
const [sendingId, setSendingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const [snackOpen, setSnackOpen] = useState(false);
const [snackMsg, setSnackMsg] = useState("Enviado");
const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("success");

const primerNombre = (full?: string) => {
  const s = String(full ?? "").trim();
  return s ? s.split(/\s+/)[0].toUpperCase() : "";
};

  // ✅ Modal Facturar / Cerrar
  const [openFacturar, setOpenFacturar] = useState(false);
  const [mrSeleccionada, setMrSeleccionada] = useState<MenuReserva | null>(null);

  const [metodoPago, setMetodoPago] = useState<MetodoPagoCierre>("EFECTIVO");
  const [nit, setNit] = useState<string>("");                 // numérico
  const [nombreFactura, setNombreFactura] = useState<string>("");

  const [buscandoNit, setBuscandoNit] = useState(false);
  const [saving, setSaving] = useState(false);

  const abrirModalFacturar = (mr: MenuReserva) => {
    setMrSeleccionada(mr);
    setMetodoPago("EFECTIVO");
    setNit("");
    setNombreFactura("");
    setOpenFacturar(true);
  };

  const cerrarModalFacturar = () => {
    if (saving) return;
    setOpenFacturar(false);
    setMrSeleccionada(null);
    setBuscandoNit(false);
  };

  // ✅ lookup por NIT (autocompleta nombre si existe)
  const buscarDatosFacturaPorNit = async (nitValue: string) => {
    const clean = nitValue.trim();
    if (!clean) return;

    try {
      setBuscandoNit(true);
      const resp = await cafeApi.get(`/facturas/datos/${clean}`);
      const data = resp.data?.data; // {nit, nombre}
      if (data?.nombre) {
        setNombreFactura(data.nombre);
      }
    } catch (e) {
      // si no existe, no hacemos nada (deja el nombre editable)
    } finally {
      setBuscandoNit(false);
    }
  };

  // ✅ handler NIT (solo números)
  const onChangeNit = (value: string) => {
    const onlyDigits = value.replace(/[^\d]/g, "");
    setNit(onlyDigits);

    // dispara búsqueda desde 5+ dígitos (ajusta a tu gusto)
    if (onlyDigits.length >= 5) {
      buscarDatosFacturaPorNit(onlyDigits);
    }
  };

  // ✅ Cerrar o Generar (ambos pagan total, uno además crea FacturaPendiente)
 const cerrarYSiHayNitGenerar = async () => {
  if (!mrSeleccionada?.reserva?._id) return;

  const nitClean = nit.trim();
  const nombreClean = nombreFactura.trim();

  // ✅ regla:
  // - sin NIT => solo cerrar
  // - con NIT => requiere nombre (si no existe, no dejar cerrar)
  if (nitClean && !nombreClean) return;

  try {
    setSaving(true);

    await cafeApi.post(`/facturas/accion`, {
      reservaId: mrSeleccionada.reserva._id,
      metodoPago,

      // opcionales: si vienen, el backend generará factura
      nit: nitClean || null,
      nombreFactura: nombreClean || null,
    });

    // ✅ reflejar en UI
  const seFacturo = !!nit.trim();

setReservas((prev) =>
  prev.map((r) =>
    r._id === mrSeleccionada._id
      ? { ...r, facturado: seFacturo, enviado: true }
      : r
  )
);

    cerrarModalFacturar();
  } catch (e) {
    console.error("❌ Error cerrar/generar factura:", e);
  } finally {
    setSaving(false);
  }
};

  const ymdLaPaz = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/La_Paz",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  // =====================================
  // CARGAR MENÚ RESERVAS
  // =====================================
  const fetchMenuReservas = async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await cafeApi.get("/menureservas");
      console.log("🔥 RESPUESTA /menureservas:", JSON.stringify(resp.data, null, 2));
      const data = resp.data.menureservas || [];

      // 1️⃣ FILTRAR MENÚS SIN RESERVA → EVITA CRASH
 const dataLimpia = data.filter((mr: any) => mr.fecha_creacion);

// 🔑 fecha seleccionada en formato YYYY-MM-DD (La Paz)
const keySelected = ymdLaPaz(fecha!);

// 2️⃣ FILTRAR POR FECHA
const filtradas: MenuReserva[] = dataLimpia.filter((mr: MenuReserva) => {
  const keyRes = ymdLaPaz(new Date(mr.fecha_creacion!));
  return keyRes === keySelected;
});

      // 3️⃣ PARA CADA RESERVA → PREGUNTAR SI YA TIENE PEDIDOS
     const filtradasConEnviado: MenuReserva[] = await Promise.all(
  filtradas.map(async (mr) => {
    try {
      const respResumen = await cafeApi.get(`/pedidos/resumen/${mr.reserva._id}`);
      const enviados: Record<string, number> = respResumen.data?.enviados || {};

      // ✅ Calcular si falta algo por enviar (comparando menureservas vs enviados)
      const faltaAlgo = mr.productos.some((it) => {
        const pid = it.producto?._id;
        const cantMenu = it.cantidad ?? 0;
        const cantEnviada = pid ? (enviados[pid] ?? 0) : 0;
        return cantMenu > cantEnviada;
      });

      // ✅ Bloqueo duro si ya está cerrado/facturado (si tu backend lo manda)
      const cerrado = !!respResumen.data?.cerrado;
      const facturado = !!respResumen.data?.facturado;

      return {
        ...mr,
        // “enviado” ahora significa “bloqueado para enviar”
        enviado: cerrado || facturado || !faltaAlgo,
        facturado: facturado || mr.facturado,
      };
    } catch (error) {
      console.error("Error consultando resumen pedidos:", error);

      // Si falla la consulta, NO bloquees por seguridad (para no frenar operación)
      return {
        ...mr,
        enviado: false,
      };
    }
  })
);

setReservas(filtradasConEnviado);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el menú de reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fecha) fetchMenuReservas();
  }, [fecha]);

  return (
 <Box
  sx={{
    width: "100%",
    bgcolor: "#fff",
    p: { xs: 0, sm: 3 },
    pt: { xs: 0, sm: 3 },
    px: { xs: 0, sm: 3 },
    mt: { xs: 0, sm: 0 },
  }}
>
   <Box
    sx={{
      pl: { xs: 6, sm: 0 },              // espacio hamburguesa
      mt: { xs: -1.2, sm: 0 },           // ✅ SUBE EN MÓVIL
      pt: 0,
      mb: { xs: 0.6, sm: 1.0 },
    }}
  >
    <Typography
      sx={{
        m: 0,
        fontWeight: 800,
        fontSize: 20,
        color: "#1e3a8a",
        letterSpacing: 0.2,
        lineHeight: 1.1,
      }}
    >
      Cuentas
    </Typography>
  </Box>

    {/* ===================================== */}
    {/*     FECHA + TÍTULO                   */}
    {/* ===================================== */}
   <Grid
  container
  alignItems={{ xs: "flex-start", sm: "center" }}
  justifyContent="flex-start"
  mb={{ xs: 1, sm: 3 }}
  sx={{
    gap: { xs: 1, sm: 3 },
  }}
>
      <Box>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            value={fecha}
            onChange={(newValue) => setFecha(newValue)}
            slots={{ openPickerIcon: CalendarTodayIcon }}
            slotProps={{
              textField: {
                size: "small",
                sx: { bgcolor: "white", borderRadius: "12px", boxShadow: 1 },
              },
            }}
          />
        </LocalizationProvider>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
        {fecha &&
          new Intl.DateTimeFormat("es-ES", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "America/La_Paz",
          }).format(fecha)}
      </Typography>
    </Grid>

    {/* ===================================== */}
    {/*             LISTADO                   */}
    {/* ===================================== */}

    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    ) : error ? (
      <Typography sx={{ textAlign: "center", mt: 5, color: "red" }}>
        {error}
      </Typography>
    ) : reservas.length === 0 ? (
      <Typography sx={{ textAlign: "center", mt: 5, color: "#777" }}>
        No hay reservas en menú para esta fecha.
      </Typography>
    ) : (
      <TableContainer
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

            "& th, & td": {
              padding: "10px 8px",
              borderBottom: "1px solid #e0e0e0",
            },

            "& th": {
              fontWeight: 600,
              whiteSpace: "normal",
              wordBreak: "break-word",
              fontSize: { xs: 12, md: 14 },
            },

            "& td": {
              fontSize: { xs: 12, md: 14 },
              whiteSpace: "normal",
              wordBreak: "break-word",
            },
          }}
        >
          <TableHead sx={{ bgcolor: "rgb(225,63,68)" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff" }}>Nombre</TableCell>
              <TableCell sx={{ color: "#fff" }}>Tipo</TableCell>
              <TableCell sx={{ color: "#fff" }}>Teléfono</TableCell>
              <TableCell sx={{ color: "#fff" }}>Monto</TableCell>
              <TableCell sx={{ color: "#fff" }}>Pago</TableCell>
              <TableCell sx={{ color: "#fff" }}>Saldo</TableCell>
              <TableCell sx={{ color: "#fff" }}>Ver</TableCell>
              <TableCell sx={{ color: "#fff" }}>Enviar Pedido</TableCell>
              <TableCell sx={{ color: "#fff" }}>Facturar</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reservas.map((mr) => {
              const COSTO_ENVASE_UNITARIO = 2;

              const subtotal = mr.productos.reduce(
                (acc, item) => acc + item.producto.precio * (item.cantidad ?? 1),
                0
              );

              const esLlevar = String(mr.reserva.tipo || "").toLowerCase() === "llevar";

              const costoEnvases = esLlevar
                ? mr.productos.reduce(
                    (acc, item) => acc + (item.cantidad ?? 1) * COSTO_ENVASE_UNITARIO,
                    0
                  )
                : 0;

              const descuento = Number(mr.reserva.descuentoCupon ?? 0);

              const monto = Math.max(0, subtotal + costoEnvases - descuento);

              const pago = Number(mr.reserva.pago ?? 0);

              const saldo = Math.max(0, monto - pago);

              return (
                <TableRow key={mr._id} hover>
                  <TableCell>{mr.reserva.nombre}</TableCell>
                  <TableCell>{mr.reserva.tipo}</TableCell>
                  <TableCell>
                    {mr.reserva.telefono.startsWith("+591")
                      ? mr.reserva.telefono.replace("+591", "")
                      : mr.reserva.telefono}
                  </TableCell>

                  <TableCell>{monto} Bs</TableCell>
                  <TableCell>{pago} Bs</TableCell>
                  <TableCell>{saldo} Bs</TableCell>

                  <TableCell>
                    <IconButton
                      onClick={() =>
                        navigate(`/MenuReservasDetalle/${mr._id}`, {
                          state: { fechaSeleccionada: fecha },
                        })
                      }
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={
                        sendingId === mr._id ? (
                          <CircularProgress size={16} sx={{ color: "#fff" }} />
                        ) : (
                          <SendIcon />
                        )
                      }
                      disabled={mr.enviado || mr.facturado || sendingId === mr._id}
                      onClick={async () => {
                        try {
                          setSendingId(mr._id);

                          const mesero = primerNombre(user?.nombre);

                          if (mesero && mr?.reserva?._id) {
                            await cafeApi.put(`/reservas/${mr.reserva._id}`, { mesero });
                          }

                          await cafeApi.post(`/pedidos/crear/${mr._id}`);

                          setSnackMsg("Enviado");
                          setSnackSeverity("success");
                          setSnackOpen(true);

                          setReservas((prev) =>
                            prev.map((r) => (r._id === mr._id ? { ...r, enviado: true } : r))
                          );
                        } catch (error) {
                          console.error("❌ No se pudo enviar pedido:", error);
                          setSnackMsg("No se pudo enviar");
                          setSnackSeverity("error");
                          setSnackOpen(true);
                        } finally {
                          setSendingId(null);
                        }
                      }}
                      sx={{
                        textTransform: "none",
                        px: 1.5,
                        fontSize: { xs: 11, md: 12 },
                        minWidth: { xs: 92, md: 100 },
                      }}
                    >
                      {sendingId === mr._id
                        ? "Enviando..."
                        : mr.facturado
                        ? "Facturado"
                        : mr.enviado
                        ? "Completo"
                        : "Enviar"}
                    </Button>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={<ReceiptIcon />}
                      disabled={mr.facturado}
                      onClick={() => abrirModalFacturar(mr)}
                      sx={{
                        textTransform: "none",
                        px: 1.5,
                        fontSize: { xs: 11, md: 12 },
                        minWidth: { xs: 80, md: 90 },
                      }}
                    >
                      {mr.facturado ? "Listo" : "Facturar"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )}

    <Dialog open={openFacturar} onClose={cerrarModalFacturar} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 800,
          pr: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Facturar / Cerrar cuenta

        <IconButton
          onClick={cerrarModalFacturar}
          size="small"
          sx={{ position: "absolute", right: 8, top: 8 }}
          disabled={saving}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ mb: 1, color: "#555" }}>
          {mrSeleccionada?.reserva?.nombre || "—"}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <RadioGroup
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPagoCierre)}
            sx={{ gap: 1.2 }}
          >
            <Box
              onClick={() => setMetodoPago("EFECTIVO")}
              sx={{
                border: "1.5px solid",
                borderColor:
                  metodoPago === "EFECTIVO" ? "rgb(225,63,68)" : "rgba(0,0,0,0.15)",
                borderRadius: "14px",
                px: 2,
                py: 1.4,
                cursor: "pointer",
                transition: "all .15s ease",
                bgcolor: metodoPago === "EFECTIVO" ? "rgba(225,63,68,0.04)" : "#fff",
                "&:hover": {
                  borderColor: "rgb(225,63,68)",
                  bgcolor: "rgba(225,63,68,0.04)",
                },
              }}
            >
              <FormControlLabel
                value="EFECTIVO"
                control={<Radio sx={{ display: "none" }} />}
                sx={{ m: 0, width: "100%" }}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: "rgba(46,125,50,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PaymentsIcon sx={{ color: "#2e7d32", fontSize: 26 }} />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Efectivo</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pago en caja / contado
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Box>

            <Box
              onClick={() => setMetodoPago("QR")}
              sx={{
                border: "1.5px solid",
                borderColor: metodoPago === "QR" ? "rgb(225,63,68)" : "rgba(0,0,0,0.15)",
                borderRadius: "14px",
                px: 2,
                py: 1.4,
                cursor: "pointer",
                transition: "all .15s ease",
                bgcolor: metodoPago === "QR" ? "rgba(225,63,68,0.04)" : "#fff",
                "&:hover": {
                  borderColor: "rgb(225,63,68)",
                  bgcolor: "rgba(225,63,68,0.04)",
                },
              }}
            >
              <FormControlLabel
                value="QR"
                control={<Radio sx={{ display: "none" }} />}
                sx={{ m: 0, width: "100%" }}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: "rgba(2,136,209,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <QrCode2Icon sx={{ color: "#0288d1", fontSize: 26 }} />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>QR</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pago con QR bancario
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Box>

            <Box
              onClick={() => setMetodoPago("TARJETA")}
              sx={{
                border: "1.5px solid",
                borderColor:
                  metodoPago === "TARJETA" ? "rgb(225,63,68)" : "rgba(0,0,0,0.15)",
                borderRadius: "14px",
                px: 2,
                py: 1.4,
                cursor: "pointer",
                transition: "all .15s ease",
                bgcolor: metodoPago === "TARJETA" ? "rgba(225,63,68,0.04)" : "#fff",
                "&:hover": {
                  borderColor: "rgb(225,63,68)",
                  bgcolor: "rgba(225,63,68,0.04)",
                },
              }}
            >
              <FormControlLabel
                value="TARJETA"
                control={<Radio sx={{ display: "none" }} />}
                sx={{ m: 0, width: "100%" }}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: "rgba(94,53,177,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CreditCardIcon sx={{ color: "#5e35b1", fontSize: 26 }} />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Tarjeta</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Débito / crédito
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>

          <TextField
            label="NIT"
            size="small"
            value={nit}
            onChange={(e) => onChangeNit(e.target.value)}
            fullWidth
            inputProps={{ inputMode: "numeric" }}
            helperText={buscandoNit ? "Buscando datos por NIT..." : " "}
          />

          <TextField
            label="Nombre a facturar"
            size="small"
            value={nombreFactura}
            onChange={(e) => setNombreFactura(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={cerrarYSiHayNitGenerar}
          disabled={saving || (nit.trim().length > 0 && !nombreFactura.trim())}
          sx={{
            height: 44,
            borderRadius: "12px",
            backgroundColor: "rgb(225,63,68)",
            "&:hover": { backgroundColor: "rgb(200,50,55)" },
            textTransform: "none",
            fontWeight: 900,
          }}
        >
          {saving ? "Cerrando..." : "Cerrar Cuenta"}
        </Button>
      </DialogActions>
    </Dialog>

    <Snackbar
      open={snackOpen}
      onClose={() => setSnackOpen(false)}
      autoHideDuration={2200}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={() => setSnackOpen(false)}
        severity={snackSeverity}
        variant="filled"
        sx={{
          borderRadius: 2,
          fontWeight: 800,
          boxShadow: 3,
        }}
      >
        {snackMsg}
      </Alert>
    </Snackbar>
  </Box>
);
}