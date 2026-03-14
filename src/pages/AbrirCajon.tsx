import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import cafeApi from "../api/cafeApi";

const AbrirCajon: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState("BARRA");
  const [okMsg, setOkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAbrirCajon = async () => {
    try {
      setLoading(true);
      setOkMsg("");
      setErrorMsg("");

      const resp = await cafeApi.post("/facturas/abrir-cajon", {
        printerName,
      });

      if (resp.data?.ok) {
        setOkMsg(resp.data?.msg || "Cajón abierto correctamente");
      } else {
        setErrorMsg(resp.data?.msg || "No se pudo abrir el cajón");
      }
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.msg ||
          e?.response?.data?.detail ||
          e?.message ||
          "Error abriendo cajón"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          maxWidth: 700,
          mx: "auto",
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
          <PointOfSaleOutlinedIcon />
          <Typography variant="h5" fontWeight={700}>
            Abrir cajón de dinero
          </Typography>
        </Box>

        <Typography sx={{ color: "#555", mb: 3 }}>
          Esta opción envía el comando de apertura a la impresora térmica donde está conectado físicamente el cajón.
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Impresora</InputLabel>
          <Select
            value={printerName}
            label="Impresora"
            onChange={(e) => setPrinterName(String(e.target.value))}
            disabled={loading}
          >
            <MenuItem value="BARRA">BARRA</MenuItem>
            <MenuItem value="COCINA">COCINA</MenuItem>
            <MenuItem value="PARRILLA">PARRILLA</MenuItem>
            <MenuItem value="Star BSC10">Star BSC10</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleAbrirCajon}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PointOfSaleOutlinedIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            py: 1.2,
            bgcolor: "#111",
            "&:hover": { bgcolor: "#000" },
          }}
        >
          {loading ? "Abriendo..." : "Abrir cajón"}
        </Button>

        {!!okMsg && <Alert severity="success" sx={{ mt: 3 }}>{okMsg}</Alert>}
        {!!errorMsg && <Alert severity="error" sx={{ mt: 3 }}>{errorMsg}</Alert>}
      </Paper>
    </Box>
  );
};

export default AbrirCajon;