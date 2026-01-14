import React, { useEffect, useState } from "react";
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
} from "@mui/material";

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

  const navigate = useNavigate();

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
      const dataLimpia = data.filter(
        (mr: any) => mr.reserva && mr.reserva.fecha
      );

      const keySelected = ymdLaPaz(fecha!);

      // 2️⃣ FILTRAR POR FECHA
      const filtradas: MenuReserva[] = dataLimpia.filter((mr: MenuReserva) => {
        const keyRes = ymdLaPaz(new Date(mr.reserva.fecha));
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
    <Box sx={{ p: 3, width: "100%", bgcolor: "#fff" }}>
      {/* ===================================== */}
      {/*     FECHA + TÍTULO                   */}
      {/* ===================================== */}
     <Grid
  container
  alignItems="center"
  justifyContent="flex-start"
  mb={3}
  sx={{
    gap: 3,              // separa elementos sin empujarlos
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
            // ✅ Sin scroll interno, solo el externo del AppContent
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
    minWidth: 950,        // 🔥 ESTA ES LA CLAVE REAL
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
                // =====================================
                //  CALCULAR MONTO REAL DEL MENÚ
                // =====================================
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

// ✅ monto real = subtotal + envases - descuento
const monto = Math.max(0, subtotal + costoEnvases - descuento);

const pago = Number(mr.reserva.pago ?? 0);

// ✅ saldo nunca negativo
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

                    {/* VER DETALLE */}
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

                    {/* ENVIAR PEDIDO */}
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<SendIcon />}
                       disabled={mr.enviado || mr.facturado}
                        onClick={async () => { 
                          try {
                            await cafeApi.post(`/pedidos/crear/${mr._id}`);

                            setReservas((prev) =>
                              prev.map((r) =>
                                r._id === mr._id
                                  ? { ...r, enviado: true }
                                  : r
                              )
                            );
                          } catch (error) {
                            console.error("Error enviando pedido:", error);
                          }
                        }}
                        sx={{
                          textTransform: "none",
                          px: 1.5,
                          fontSize: { xs: 11, md: 12 },
                          minWidth: { xs: 80, md: 90 },
                        }}
                      >
                       {mr.facturado ? "Facturado" : mr.enviado ? "Completo" : "Enviar"}
                      </Button>
                    </TableCell>

                    {/* FACTURAR */}
                    <TableCell>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        startIcon={<ReceiptIcon />}
                        disabled={mr.facturado}
                        onClick={() => navigate(`/Facturar/${mr._id}`)}
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
    </Box>
  );
}