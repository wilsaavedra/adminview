import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Stack,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import cafeApi from "../api/cafeApi";

type TvBirthday = {
  _id: string;
  nombre: string;
  fecha: string;
  activo: boolean;
};

export default function PantallaTV() {
  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const [items, setItems] = useState<TvBirthday[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    const { data } = await cafeApi.get("/tv-birthdays");
    setItems(data.items || []);
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    if (!fecha || !nombre.trim()) return;

    setLoading(true);
    await cafeApi.post("/tv-birthdays", {
      fecha,
      nombre: nombre.trim(),
    });

    setNombre("");
    await cargar();
    setLoading(false);
  };

  const eliminar = async (id: string) => {
    await cafeApi.delete(`/tv-birthdays/${id}`);
    await cargar();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Pantalla TV
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 560, mb: 3 }}>
        <Typography fontWeight={600} mb={2}>
          Agregar cumpleaños
        </Typography>

        <TextField
          fullWidth
          label="Fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Nombre del cumpleañero"
          placeholder="Ej: Karla"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={guardar}
          sx={{
            bgcolor: "rgb(225,63,68)",
            "&:hover": { bgcolor: "rgb(200,45,50)" },
            fontWeight: 700,
          }}
        >
          Guardar para TV
        </Button>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Typography fontWeight={700} mb={2}>
          Cumpleaños cargados
        </Typography>

        {items.length === 0 ? (
          <Typography color="text.secondary">
            No hay cumpleaños cargados.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((item) => (
              <Box
                key={item._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #eee",
                  borderRadius: 2,
                  px: 2,
                  py: 1.2,
                }}
              >
                <Box>
                  <Typography fontWeight={700}>{item.nombre}</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {item.fecha}
                  </Typography>
                </Box>

                <IconButton onClick={() => eliminar(item._id)} color="error">
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}