import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
    producto: { precio: number; nombre: string };
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
  };
  enviado?: boolean;
  facturado?: boolean;
}

export default function MenuReservas() {
  const [reservas, setReservas] = useState<MenuReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

const [fecha, setFecha] = useState<Date | null>(
  location.state?.fechaSeleccionada ? new Date(location.state.fechaSeleccionada) : new Date()
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
const dataLimpia = data.filter((mr: any) => mr.reserva && mr.reserva.fecha);

const keySelected = ymdLaPaz(fecha!);

// 2️⃣ AHORA FILTRAMOS POR LA FECHA
const filtradas = dataLimpia.filter((mr: MenuReserva) => {
  const keyRes = ymdLaPaz(new Date(mr.reserva.fecha));
  return keyRes === keySelected;
});

      setReservas(filtradas);
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
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
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
  component={Paper}
  sx={{
    display: "block",         // 👈 necesario para scroll real
    width: "100%",
    overflowX: "auto",        // 👈 scroll afuera OK
    WebkitOverflowScrolling: "touch", // 👈 iPhone scroll suave
    borderRadius: 2,
    boxShadow: 2,
  }}
>
          <Table sx={{ minWidth: 950 }}>
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
                const monto = mr.productos.reduce(
                  (acc, item) =>
                    acc + item.producto.precio * (item.cantidad ?? 1),
                  0
                );

                const pago = mr.reserva.pago ?? 0;
                const saldo = monto - pago;

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
                            state: { fechaSeleccionada: fecha }
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
                        disabled={mr.enviado}
                        onClick={() => navigate(`/EnviarPedido/${mr._id}`)}
                        sx={{ textTransform: "none" }}
                      >
                        {mr.enviado ? "Enviado" : "Enviar"}
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
                        sx={{ textTransform: "none" }}
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