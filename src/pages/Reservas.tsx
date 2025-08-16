/*import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { es } from "date-fns/locale";
import { parseISO, isSameDay, format, compareAsc } from "date-fns";

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
}

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
});

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reservas[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);

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
      const reservasFiltradas: Reservas[] = data
        .filter((reserva) => isSameDay(parseISO(reserva.fecha), fechaSeleccionada))
        .sort((a, b) =>
          compareAsc(parseISO(a.fecha), parseISO(b.fecha))
        )
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
    <Box sx={{ p: 3, bgcolor: "#fff", minHeight: "100vh" }}>
      
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

        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#333", textAlign: "right" }}
          >
            {fecha?.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
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
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: "rgb(225,63,68)" }}>
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>Nombre</TableCell>
                <TableCell sx={{ color: "#fff" }}>Hora</TableCell>
                <TableCell sx={{ color: "#fff" }}>Cantidad</TableCell>
                <TableCell sx={{ color: "#fff" }}>Teléfono</TableCell>
                <TableCell sx={{ color: "#fff" }}>Asistira</TableCell>
                <TableCell sx={{ color: "#fff" }}>Comentarios</TableCell>
                <TableCell sx={{ color: "#fff" }}>Estado</TableCell>
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
                  <TableCell>{format(parseISO(reserva.fecha), "HH:mm")}</TableCell>
                  <TableCell>{reserva.cantidad}</TableCell>
                  <TableCell>{reserva.telefono}</TableCell>
                  <TableCell>{reserva.confirmacion ? "Confirmado" : ""}</TableCell>
                  <TableCell>{reserva.comentarios}</TableCell>
                  <TableCell>
                    <Select
                      value={reserva.resest || "Pendiente"}
                      size="small"
                      onChange={async (e) => {
                        const nuevoEstado = e.target.value;
                        // Actualiza localmente
                        setReservas((prev) =>
                          prev.map((r) =>
                            r._id === reserva._id ? { ...r, resest: nuevoEstado } : r
                          )
                        );
                        // Actualiza en la BD
                        try {
                          await API.put(`/reservas/${reserva._id}`, {
                            resest: nuevoEstado,
                          });
                        } catch (err) {
                          console.error("Error al actualizar estado:", err);
                        }
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
    </Box>
  );
}*/

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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { es } from "date-fns/locale";
import { parseISO, isSameDay, format, compareAsc } from "date-fns";

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
}

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
});

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reservas[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);

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
      const reservasFiltradas: Reservas[] = data
        .filter((reserva) => isSameDay(parseISO(reserva.fecha), fechaSeleccionada))
        .sort((a, b) =>
          compareAsc(parseISO(a.fecha), parseISO(b.fecha))
        )
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
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#333", textAlign: "right" }}
          >
            {fecha?.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
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
          boxShadow: 3,
          width: "100%",
          //overflowX: "auto", // Scroll horizontal en pantallas pequeñas
          "@media (max-width: 900px)": {
            maxWidth: "100vw",
          },
        }}
      >
        <Table
          sx={{
            minWidth: 650, // Mantiene buen formato en escritorio
          }}
        >
          <TableHead sx={{ bgcolor: "rgb(225,63,68)" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Nombre</TableCell>
              <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Hora</TableCell>
              <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Cantidad</TableCell>
              <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Teléfono</TableCell>
              <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Asistira</TableCell>
              <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>Comentarios</TableCell>
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
                <TableCell>{format(parseISO(reserva.fecha), "HH:mm")}</TableCell>
                <TableCell>{reserva.cantidad}</TableCell>
                <TableCell>{reserva.telefono}</TableCell>
                <TableCell>{reserva.confirmacion ? "Confirmado" : ""}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: { xs: 120, sm: 200, md: "auto" }, // controla ancho en móvil
                    whiteSpace: "normal", // permite salto de línea
                    wordWrap: "break-word",
                  }}
                >
                  {reserva.comentarios}
                </TableCell>
                <TableCell>
                  <Select
                    value={reserva.resest || "Pendiente"}
                    size="small"
                    onChange={async (e) => {
                      const nuevoEstado = e.target.value;
                      setReservas((prev) =>
                        prev.map((r) =>
                          r._id === reserva._id ? { ...r, resest: nuevoEstado } : r
                        )
                      );
                      try {
                        await API.put(`/reservas/${reserva._id}`, {
                          resest: nuevoEstado,
                        });
                      } catch (err) {
                        console.error("Error al actualizar estado:", err);
                      }
                    }}
                    sx={{
                      minWidth: { xs: 100, sm: 120, md: 140 }, // ajusta select según dispositivo
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
    </Box>
  );
}
