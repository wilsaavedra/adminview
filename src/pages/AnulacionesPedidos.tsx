import React, { useEffect, useMemo, useState } from "react";
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
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import cafeApi from "../api/cafeApi";

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
    mesa?: string;
    comentarios: string;
    fecha: string;
    pago: number;
    descuentoCupon?: number;
    resest?: string;
    cerrado?: boolean;
    facturado?: boolean;
  };
  enviado?: boolean;
  facturado?: boolean;
}

interface ProductoAnulable {
  productoId: string;
  nombre: string;
  cantidadMenu: number;
  cantidadEnviada: number;
  maxAnular: number;
}

const ymdLaPaz = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

export default function AnulacionesPedidos() {
  const [reservas, setReservas] = useState<MenuReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [openDetalle, setOpenDetalle] = useState(false);
  const [mrSeleccionada, setMrSeleccionada] = useState<MenuReserva | null>(null);
  const [productosAnulables, setProductosAnulables] = useState<ProductoAnulable[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [openAnular, setOpenAnular] = useState(false);
  const [productoSel, setProductoSel] = useState<ProductoAnulable | null>(null);
  const [cantidadAnular, setCantidadAnular] = useState<number>(1);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("success");

  const fetchMenuReservas = async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await cafeApi.get("/menureservas");
      const data = resp.data.menureservas || [];

      const keySelected = ymdLaPaz(fecha || new Date());

      const filtradas = data.filter((mr: MenuReserva) => {
        if (!mr.fecha_creacion || !mr.reserva?._id) return false;
        const keyRes = ymdLaPaz(new Date(mr.fecha_creacion));
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
    fetchMenuReservas();
  }, [fecha]);

  const handleRefresh = async () => {
    await fetchMenuReservas();
  };

  const abrirDetalle = async (mr: MenuReserva) => {
    try {
      setMrSeleccionada(mr);
      setOpenDetalle(true);
      setLoadingDetalle(true);
      setProductosAnulables([]);

      const respResumen = await cafeApi.get(`/pedidos/resumen/${mr.reserva._id}`);
      const enviados: Record<string, number> = respResumen.data?.enviados || {};
      const cerrado = !!respResumen.data?.cerrado;
      const facturado = !!respResumen.data?.facturado;

      const prods: ProductoAnulable[] = (mr.productos || [])
        .map((it) => {
          const productoId = it.producto?._id;
          const cantidadMenu = Number(it.cantidad || 0);
          const cantidadEnviada = productoId ? Number(enviados[productoId] || 0) : 0;

          return {
            productoId,
            nombre: it.producto?.nombre || "Producto",
            cantidadMenu,
            cantidadEnviada,
            maxAnular: Math.min(cantidadMenu, cantidadEnviada),
          };
        })
        .filter((x) => x.productoId && x.maxAnular > 0);

      setProductosAnulables(prods);

      if (cerrado || facturado) {
        setSnackMsg("La cuenta está cerrada o facturada. Ya no se puede anular.");
        setSnackSeverity("info");
        setSnackOpen(true);
      }
    } catch (e) {
      console.error(e);
      setSnackMsg("No se pudo cargar el detalle de anulación");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const abrirDialogAnular = (prod: ProductoAnulable) => {
    setProductoSel(prod);
    setCantidadAnular(1);
    setMotivo("");
    setOpenAnular(true);
  };

  const confirmarAnulacion = async () => {
    if (!mrSeleccionada?.reserva?._id || !productoSel?.productoId) return;

    const cantidad = Number(cantidadAnular || 0);
    if (cantidad <= 0 || cantidad > Number(productoSel.maxAnular || 0)) return;
    if (!motivo.trim()) return;

    try {
      setSaving(true);

      await cafeApi.post("/pedidos/anular", {
        reservaId: mrSeleccionada.reserva._id,
        productoId: productoSel.productoId,
        cantidad,
        motivo: motivo.trim(),
      });

      setSnackMsg("Producto anulado correctamente");
      setSnackSeverity("success");
      setSnackOpen(true);
      setOpenAnular(false);

      await fetchMenuReservas();

      if (mrSeleccionada) {
        const actualizada = reservas.find((r) => r._id === mrSeleccionada._id);
        if (actualizada) {
          await abrirDetalle(actualizada);
        } else {
          setOpenDetalle(false);
          setMrSeleccionada(null);
        }
      }
        } catch (e: any) {
      console.error("❌ Error anular:", e?.response?.data || e);

      setSnackMsg(
        e?.response?.data?.msg ||
        e?.response?.data?.error ||
        e?.message ||
        "No se pudo anular"
      );
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const filas = useMemo(() => reservas, [reservas]);

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
          pl: { xs: 6, sm: 0 },
          mt: { xs: -0.2, sm: 0 },
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
          Anulaciones
        </Typography>
      </Box>

      <Grid
        container
        alignItems="center"
        justifyContent="flex-start"
        mb={{ xs: 1, sm: 3 }}
        sx={{ gap: { xs: 1, sm: 3 } }}
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
                  sx: {
                    bgcolor: "white",
                    borderRadius: "12px",
                    boxShadow: 1,
                    minWidth: 170,
                  },
                },
              }}
            />
          </LocalizationProvider>

          <IconButton
            onClick={handleRefresh}
            disabled={loading}
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography sx={{ textAlign: "center", mt: 5, color: "red" }}>
          {error}
        </Typography>
      ) : filas.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 5, color: "#777" }}>
          No hay cuentas para esta fecha.
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
              minWidth: 820,
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
                <TableCell sx={{ color: "#fff" }}>Mesa</TableCell>
                <TableCell sx={{ color: "#fff" }}>Teléfono</TableCell>
                <TableCell sx={{ color: "#fff" }}>Productos</TableCell>
                <TableCell sx={{ color: "#fff" }}>Ver / Anular</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filas.map((mr) => (
                <TableRow key={mr._id} hover>
                  <TableCell>{mr.reserva.nombre}</TableCell>
                  <TableCell>{mr.reserva.mesa || "—"}</TableCell>
                  <TableCell>
                    {mr.reserva.telefono?.startsWith("+591")
                      ? mr.reserva.telefono.replace("+591", "")
                      : mr.reserva.telefono}
                  </TableCell>
                  <TableCell>{mr.productos?.length || 0}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => abrirDetalle(mr)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 800,
            pr: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Anular productos enviados
          <IconButton
            onClick={() => setOpenDetalle(false)}
            size="small"
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ mb: 2, color: "#555", fontWeight: 700 }}>
            {mrSeleccionada?.reserva?.nombre || "—"} {mrSeleccionada?.reserva?.mesa ? `- Mesa ${mrSeleccionada.reserva.mesa}` : ""}
          </Typography>

          {loadingDetalle ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : productosAnulables.length === 0 ? (
            <Typography sx={{ color: "#777" }}>
              No hay productos enviados disponibles para anular.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>En menú</TableCell>
                    <TableCell>Enviado</TableCell>
                    <TableCell>Máx. anular</TableCell>
                    <TableCell>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosAnulables.map((p) => (
                    <TableRow key={p.productoId}>
                      <TableCell>{p.nombre}</TableCell>
                      <TableCell>{p.cantidadMenu}</TableCell>
                      <TableCell>{p.cantidadEnviada}</TableCell>
                      <TableCell>{p.maxAnular}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<BackspaceOutlinedIcon />}
                          onClick={() => abrirDialogAnular(p)}
                          sx={{ textTransform: "none", fontWeight: 700 }}
                        >
                          Anular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openAnular} onClose={() => !saving && setOpenAnular(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirmar anulación
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ mb: 2, color: "#555" }}>
            {productoSel?.nombre || "Producto"}
          </Typography>

          <TextField
            select
            label="Cantidad a anular"
            size="small"
            fullWidth
            value={cantidadAnular}
            onChange={(e) => setCantidadAnular(Number(e.target.value))}
            sx={{ mb: 2, mt: 1 }}
          >
            {Array.from({ length: Number(productoSel?.maxAnular || 0) }, (_, i) => i + 1).map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Motivo de anulación"
            size="small"
            fullWidth
            multiline
            minRows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAnular(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarAnulacion}
            disabled={saving || !motivo.trim()}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {saving ? "Anulando..." : "Confirmar anulación"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        onClose={() => setSnackOpen(false)}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 800, boxShadow: 3 }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}