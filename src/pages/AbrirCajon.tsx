import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import cafeApi from "../api/cafeApi";
import { toast } from "react-toastify";

const AbrirCajon: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleAbrirCajon = async () => {
    try {
      setLoading(true);
      setOpenConfirm(false);

      const resp = await cafeApi.post("/facturas/abrir-cajon", {
        printerName: "Star BSC10",
      });

      if (resp.data?.ok) {
        toast.success(resp.data?.msg || "Cajón abierto correctamente");
      } else {
        toast.error(resp.data?.msg || "No se pudo abrir el cajón");
      }
    } catch (e: any) {
      toast.error(
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
          Esta opción abrirá el cajón de dinero.
        </Typography>

        <Button
          variant="contained"
          onClick={() => setOpenConfirm(true)}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : <PointOfSaleOutlinedIcon />
          }
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

        <Dialog
          open={openConfirm}
          onClose={() => !loading && setOpenConfirm(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Confirmar acción
          </DialogTitle>

          <DialogContent>
            <Typography>
              ¿Está seguro de abrir el cajón de dinero?
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setOpenConfirm(false)}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#444",
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={handleAbrirCajon}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: "#111",
                "&:hover": { bgcolor: "#000" },
              }}
            >
              Sí, abrir
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default AbrirCajon;