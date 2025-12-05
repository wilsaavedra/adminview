import React, { useEffect, useState } from "react";
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
  Select,
  MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { es } from "date-fns/locale";
import { parseISO, isSameDay, format, compareAsc } from "date-fns";
import { TextField } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface CreadoPor {
  _id: string;
  nombre: string;
}
interface Categoria {
  _id: string;
  nombre: string;
  usuario?: CreadoPor;
}
interface Reservas {
  cantidad: number;
  _id: string;
  fecha: string;
  pago: number;
  tipo: string;
  usuario: Categoria;
  telefono: string;
  nombre: string;
  confirmacion: boolean;
  comentarios: string;
  resest: string;
  mesa?:string;
}

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
});

// Helper para comparar solo fecha UTC (año, mes, día en UTC)
const isSameUtcDate = (d1: Date, d2: Date) => {
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  };
  
  // Convierte la fecha seleccionada a medianoche UTC del día elegido
  const toUtcMidnight = (local: Date) =>
    new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));

// Devuelve la fecha "YYYY-MM-DD" en zona America/La_Paz
const ymdLaPaz = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/La_Paz",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);


export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reservas[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);
  const totalPax = reservas.reduce((sum, r) => sum + (r.cantidad || 0), 0);

  const [open, setOpen] = useState(false);
const [reservaSeleccionada, setReservaSeleccionada] = useState<any>(null);

  
  const fetchReservas = async (
    fechaSeleccionada: Date,
    setReservas: (r: Reservas[]) => void,
    setLoading: (b: boolean) => void,
    setError: (s: string | null) => void
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get("/reservas");
      const data: Reservas[] = Array.isArray(response.data.reservas)
        ? response.data.reservas
        : [];

      // Filtrar por fecha y ordenar por hora ascendente
   // Filtrar por fecha (día local Bolivia) y ordenar por hora ascendente
const selectedKey = ymdLaPaz(fechaSeleccionada);

const reservasFiltradas: Reservas[] = data
  .filter((reserva) => {
    const keyReserva = ymdLaPaz(new Date(reserva.fecha)); // fecha de la reserva en La Paz
    return keyReserva === selectedKey;                     // compara día local Bolivia
  })
  .sort((a, b) => {
    const horaA = new Date(a.fecha).getHours() * 60 + new Date(a.fecha).getMinutes();
    const horaB = new Date(b.fecha).getHours() * 60 + new Date(b.fecha).getMinutes();
    return horaA - horaB;
  })
  .map((r) => ({ ...r, resest: r.resest || "Pendiente" }));

setReservas(reservasFiltradas);
    } catch (err) {
      console.error("Error al cargar reservas", err);
      setError("No se pudo cargar las reservas.");
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fecha) fetchReservas(fecha, setReservas, setLoading, setError);
  }, [fecha]);

  const getRowColor = (estado: string) => {
    switch (estado) {
      case "Llego":
        return "rgba(0,200,0,0.1)";
      case "Cancelo":
        return "rgba(255,165,0,0.1)";
      case "No vino":
        return "rgba(255,192,203,0.2)";
      default:
        return "transparent";
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#fff" }}>
      
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
         
          {reservas.length > 0 && (
            <Typography
                variant="subtitle1"
                sx={{ mt: 1, fontWeight: 500, color: "#444" }}
            >
                Cantidad Pax: {totalPax}
            </Typography>
            )}
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#333", textAlign: "right" }}
          >
           {fecha &&
            new Intl.DateTimeFormat("es-ES", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "America/La_Paz",   // 👈 aquí fuerza Bolivia
            }).format(fecha)}
          </Typography>
        </Box>
      </Grid>

   
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
          No hay reservas para esta fecha.
        </Typography>
      ) : (
        <TableContainer
        component={Paper}
        sx={{
            display: "block", //se aumento
          //boxShadow: 3,
          width: "100%",
          overflowX: "visible", // Scroll horizontal en pantallas pequeñas  visible
          "@media (max-width: 900px)": {   
            maxWidth: "100vw",
          },
        }}
      >
 <Table
  sx={{
    width: "100%",
    tableLayout: "fixed",      // 👉 columnas fijas: no se pisan entre sí
    borderCollapse: "collapse",
    "& th, & td": {
      border: "none",
      padding: "10px 6px",
    },
  }}
>
  <TableHead sx={{ bgcolor: "rgb(225,63,68)" }}>
    <TableRow>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Nombre</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Hora</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Pax</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Teléfono</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Asistira</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Comentarios</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Adelanto</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Mesa</TableCell>
      <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Estado</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {reservas.map((reserva) => (
      <TableRow
        key={reserva._id}
        hover
        sx={{ bgcolor: getRowColor(reserva.resest) }}
      >
        <TableCell>{reserva.nombre}</TableCell>

        <TableCell>
          {new Intl.DateTimeFormat("es-BO", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/La_Paz",
          }).format(new Date(reserva.fecha))}
        </TableCell>

        <TableCell>{reserva.cantidad}</TableCell>

        <TableCell>
          {reserva.telefono.startsWith("+591")
            ? reserva.telefono.replace("+591", "")
            : reserva.telefono}
        </TableCell>

        <TableCell>{reserva.confirmacion ? "Confirmado" : ""}</TableCell>

        <TableCell
          sx={{
            maxWidth: { xs: 120, sm: 200, md: "auto" },
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
        >
          {reserva.comentarios}
        </TableCell>

        <TableCell
          sx={{
            maxWidth: { xs: 120, sm: 200, md: "auto" },
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
        >
          {reserva.pago !== 0 ? reserva.pago : ""}
        </TableCell>

        <TableCell
          sx={{
            maxWidth: { xs: 50, sm: 60, md: 80 },
            whiteSpace: "nowrap",
            padding: "0.25rem",
            "& .MuiInputBase-root": {
              bgcolor: "white",
            },
          }}
        >
          <TextField
            value={reserva.mesa || ""}
            size="small"
            variant="outlined"
            inputProps={{
              maxLength: 2,
              style: { textAlign: "center" },
            }}
            onChange={(e) => {
              const nuevaMesa = e.target.value;
              setReservas((prev) =>
                prev.map((r) =>
                  r._id === reserva._id ? { ...r, mesa: nuevaMesa } : r
                )
              );
            }}
            onBlur={async (e) => {
              try {
                await API.put(`/reservas/${reserva._id}`, {
                  mesa: e.target.value || "",
                });
              } catch (err) {
                console.error("Error al actualizar mesa:", err);
              }
            }}
            sx={{
              width: "100%",
              "& input": { p: 0.5 },
            }}
          />
        </TableCell>

        <TableCell>
          <Select
            value={reserva.resest || "Pendiente"}
            size="small"
            onChange={async (e) => {
              const nuevoEstado = e.target.value;
              try {
                if (nuevoEstado === "Cancelo") {
                  setReservaSeleccionada(reserva);
                  setOpen(true);
                } else {
                  await API.put(`/reservas/${reserva._id}`, {
                    resest: nuevoEstado,
                  });

                  setReservas((prev) =>
                    prev.map((r) =>
                      r._id === reserva._id ? { ...r, resest: nuevoEstado } : r
                    )
                  );
                }
              } catch (err) {
                console.error("Error al actualizar estado:", err);
              }
            }}
            sx={{
              minWidth: { xs: 100, sm: 120, md: 140 },
            }}
          >
            {["Pendiente", "Llego", "Cancelo", "No vino"].map((estado) => (
              <MenuItem key={estado} value={estado}>
                {estado}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
      </TableContainer>
      
      )}

{/* Dialog de confirmación */}
<Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Confirmar cancelación
      </DialogTitle>
      <DialogContent>
        <Typography>
          Estás seguro de cancelar esta reserva? <br />
          Se eliminará la reserva definitivamente.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} variant="outlined">
          NO
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={async () => {
            if (reservaSeleccionada) {
              await API.put(`/reservas/${reservaSeleccionada._id}`, {
                resest: "Cancelo",
                estado: false,
              });
              setReservas((prev) =>
                prev.filter((r) => r._id !== reservaSeleccionada._id)
              );
            }
            setOpen(false);
          }}
        >
          SI
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
 
}

