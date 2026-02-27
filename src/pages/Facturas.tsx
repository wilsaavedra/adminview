import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Button,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PrintIcon from "@mui/icons-material/Print";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import TodayIcon from "@mui/icons-material/Today";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import cafeApi from "../api/cafeApi";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

type Factura = {
  _id: string;
  createdAt?: string;
  nit?: string;
  nombreFactura?: string;
  total?: number;
  estado?: string;
  cuf?: string;
  numeroFactura?: number;
};

const ymdLaPaz = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

export default function Facturas() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  const [from, setFrom] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [to, setTo] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

    const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("success");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [facturaToPrint, setFacturaToPrint] = useState<Factura | null>(null);
  const [printing, setPrinting] = useState(false);

  const queryParams = useMemo(() => {
    const fromKey = from ? ymdLaPaz(from) : "";
    const toKey = to ? ymdLaPaz(to) : "";
    return { from: fromKey, to: toKey };
  }, [from, to]);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (queryParams.from) qs.set("from", queryParams.from);
      if (queryParams.to) qs.set("to", queryParams.to);
      const resp = await cafeApi.get(`/facturas/historial?${qs.toString()}`);
      setFacturas(resp.data?.facturas || []);
    } catch (e) {
      console.error(e);
      setFacturas([]);
      setSnackMsg("No se pudo cargar el historial de facturas.");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = () => {
    fetchFacturas();
  };

  const setHoy = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setFrom(d);
    setTo(d);
    setTimeout(() => fetchFacturas(), 0);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, bgcolor: "#fff", width: "100%" }}>
     <Box
  sx={{
    display: "flex",
    alignItems: { xs: "stretch", sm: "center" },
    justifyContent: "space-between",
    gap: 1.5,
    flexDirection: { xs: "column", sm: "row" },
    mb: 2,
  }}
>
  <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#1e3a8a" }}>
    Facturas
  </Typography>
</Box>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 2,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label="Desde"
            value={from}
            onChange={(v) => v && setFrom(v)}
            slots={{ openPickerIcon: CalendarTodayIcon }}
            slotProps={{
              textField: {
                size: "small",
                sx: { bgcolor: "white", borderRadius: "12px", boxShadow: 1, minWidth: { xs: "100%", sm: 220 } },
              },
            }}
          />
          <DatePicker
            label="Hasta"
            value={to}
            onChange={(v) => v && setTo(v)}
            slots={{ openPickerIcon: CalendarTodayIcon }}
            slotProps={{
              textField: {
                size: "small",
                sx: { bgcolor: "white", borderRadius: "12px", boxShadow: 1, minWidth: { xs: "100%", sm: 220 } },
              },
            }}
          />
        </LocalizationProvider>

        <Tooltip title="Aplica el rango de fechas seleccionado">
          <Button
            onClick={aplicarFiltro}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 900,
              backgroundColor: "rgb(225,63,68)",
              "&:hover": { backgroundColor: "rgb(200,50,55)" },
              height: 40,
              alignSelf: { xs: "stretch", sm: "auto" },
            }}
          >
            Filtrar
          </Button>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          sx={{
            boxShadow: "none",
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Table sx={{ minWidth: 900 }} size={isMobile ? "small" : "medium"}>
            <TableHead sx={{ bgcolor: "rgb(225,63,68)" }}>
              <TableRow>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Fecha</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>NIT/CI</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Razón Social</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Total</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Nro</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Estado</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {facturas.map((f) => (
                <TableRow key={f._id} hover>
                  <TableCell>
                    {f.createdAt ? new Date(f.createdAt).toLocaleString("es-BO") : "—"}
                  </TableCell>
                  <TableCell>{f.nit || "—"}</TableCell>
                  <TableCell>{f.nombreFactura || "—"}</TableCell>
                  <TableCell>{(f.total ?? 0).toFixed(2)} Bs</TableCell>
                  <TableCell>{f.numeroFactura ?? "—"}</TableCell>
                  <TableCell>{f.estado || "—"}</TableCell>

                  <TableCell>
  <Tooltip title="Reimprimir">
  <span>
    <IconButton
      onClick={() => {
        setFacturaToPrint(f);
        setConfirmOpen(true);
      }}
      disabled={String(f.estado || "").toLowerCase() !== "emitida"}
    >
      <PrintIcon />
    </IconButton>
  </span>
</Tooltip>

<Tooltip title="Anular">
  <span>
    <IconButton
      onClick={async () => {
        try {
          const motivo = prompt("Código motivo de anulación (ej: 1,2,3...)");
          if (!motivo) return;
          await cafeApi.post(`/facturas/anular`, {
            idFacturaPendiente: f._id,
            codigoMotivo: Number(motivo),
          });
          setSnackMsg("Factura anulada.");
          setSnackSeverity("success");
          setSnackOpen(true);
          fetchFacturas();
        } catch (e: any) {
          console.error(e);
          const msg = e?.response?.data?.msg || "No se pudo anular.";
          setSnackMsg(msg);
          setSnackSeverity("error");
          setSnackOpen(true);
        }
      }}
      disabled={String(f.estado || "").toLowerCase() !== "emitida"}
    >
      <DeleteOutlineIcon />
    </IconButton>
  </span>
</Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {facturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#777" }}>
                    No hay facturas en este rango.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
<Dialog
  open={confirmOpen}
  onClose={() => (printing ? null : setConfirmOpen(false))}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle sx={{ fontWeight: 900 }}>Confirmar impresión</DialogTitle>

  <DialogContent>
    <Typography sx={{ mt: 0.5 }}>
      ¿Seguro que deseas reimprimir esta factura?
    </Typography>

    <Typography sx={{ mt: 1, color: "#666" }}>
      Nro: {facturaToPrint?.numeroFactura ?? "—"} | NIT/CI: {facturaToPrint?.nit ?? "—"}
    </Typography>
  </DialogContent>

  <DialogActions sx={{ px: 2, pb: 2 }}>
    <Button
      onClick={() => setConfirmOpen(false)}
      disabled={printing}
      sx={{ textTransform: "none", fontWeight: 800 }}
    >
      Cancelar
    </Button>

    <Button
      variant="contained"
      disabled={printing || !facturaToPrint?._id}
      onClick={async () => {
        if (!facturaToPrint?._id) return;
        try {
          setPrinting(true);

          // ✅ Imprime directo (backend ya prioriza rollo)
          await cafeApi.post(`/facturas/${facturaToPrint._id}/print`, {
            printerName: "BARRA",
            // el backend ya usa rollo; dejamos DETALLE por reimpresión
            modo: "DETALLE",
          });

          setSnackMsg("Enviado a impresión (BARRA).");
          setSnackSeverity("success");
          setSnackOpen(true);
          setConfirmOpen(false);
        } catch (e: any) {
          console.error(e);
          const msg = e?.response?.data?.msg || "No se pudo reimprimir.";
          setSnackMsg(msg);
          setSnackSeverity("error");
          setSnackOpen(true);
        } finally {
          setPrinting(false);
        }
      }}
      sx={{
        textTransform: "none",
        fontWeight: 900,
        borderRadius: 2,
        backgroundColor: "rgb(225,63,68)",
        "&:hover": { backgroundColor: "rgb(200,50,55)" },
      }}
    >
      {printing ? "Imprimiendo..." : "Imprimir"}
    </Button>
  </DialogActions>
</Dialog>
      <Snackbar
        open={snackOpen}
        onClose={() => setSnackOpen(false)}
        autoHideDuration={2400}
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