import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import cafeApi from "../api/cafeApi";
import PrintIcon from "@mui/icons-material/Print";
// ---------------- TIPADO ----------------
interface MenuReservasDetalleState {
  fechaSeleccionada: Date | string;
}

interface DetalleMenuReserva {
  _id: string;
  productos: {
    cantidad: number;
    producto: {
      nombre: string;
      precio: number;
      img?: string;
      categoria?: { nombre: string };
    };
  }[];
  reserva: {
    nombre: string;
    telefono: string;
    tipo: string;
    comentarios: string;
    fecha: string;
    pago?: number;
  };
}

// ---------------- COMPONENTE ----------------
export default function MenuReservasDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const location = useLocation() as unknown as Location & {
    state: MenuReservasDetalleState;
  };

  const fechaSeleccionada = location.state?.fechaSeleccionada;

  const [data, setData] = useState<DetalleMenuReserva | null>(null);
  const [loading, setLoading] = useState(true);

const [openTicket, setOpenTicket] = useState(false);
const [ticketText, setTicketText] = useState("");

// ✅ Snackbar (impresión)
const [snackOpen, setSnackOpen] = useState(false);
const [snackMsg, setSnackMsg] = useState("");
const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("info");


  const loadDetalle = async () => {
    try {
      const resp = await cafeApi.get(`/menureservas/${id}`);
      setData(resp.data);
    } catch (error) {
      console.error("Error cargando detalle:", error);
    } finally {
      setLoading(false);
    }
  };

  const imprimirCuenta = async () => {
  try {
    if (!id) return;

    // ✅ Snackbar: enviando...
    setSnackSeverity("info");
    setSnackMsg("ENVIANDO A IMPRESIÓN…");
    setSnackOpen(true);

    const resp = await cafeApi.post(`/impresion/cuenta/${id}`);

    if (resp.data?.printed) {
      setSnackSeverity("success");
      setSnackMsg("CUENTA ENVIADA A IMPRESIÓN.");
      setSnackOpen(true);
      return;
    }

    // printed:false => preview
    const ticket = resp.data?.ticket;
    if (ticket) {
      setTicketText(ticket);
      setOpenTicket(true);
    }

    setSnackSeverity("info");
    setSnackMsg(String(resp.data?.msg || "TICKET GENERADO (PREVIEW).").toUpperCase());
    setSnackOpen(true);
  } catch (e: any) {
    console.error("❌ imprimirCuenta:", e?.response?.status, e?.response?.data || e);

    const msg =
      String(e?.response?.data?.msg || e?.response?.data?.message || "NO SE PUDO IMPRIMIR.").toUpperCase();

    setSnackSeverity("error");
    setSnackMsg(msg);
    setSnackOpen(true);
  }
};

  useEffect(() => {
    loadDetalle();
  }, [id]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress size={55} sx={{ color: "#b71c1c" }} />
      </Box>
    );

  if (!data)
    return (
      <Typography sx={{ textAlign: "center", mt: 10, color: "red" }}>
        No se encontró el menú de reserva.
      </Typography>
    );

  const subtotal = data.productos.reduce(
    (acc, item) => acc + item.producto.precio * item.cantidad,
    0
  );

  const pago = data.reserva.pago ?? 0;
  const saldo = subtotal - pago;

  // ---------- FORMATO FECHA PREMIUM ----------
  const fechaElegante =
    new Date(data.reserva.fecha)
      .toLocaleString("es-BO", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(".", "")
      .replace(/ de /g, " ")
      .replace("  ", " ");

  // ---------- AGRUPACIÓN POR CATEGORÍA ----------
  const productosAgrupados = data.productos.reduce((acc: any, item) => {
    const categoria = item.producto.categoria?.nombre || "OTROS";
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(item);
    return acc;
  }, {});

  return (
<Box
  sx={{
    px: { xs: 1.2, sm: 2 },
    py: 3,
    width: "100%",
    mx: "auto",
    mb: 10,
    boxSizing: "border-box",
    overflowX: "hidden",   
    animation: "fadeIn 0.4s ease",
  }}
>
      {/* ---------------- HEADER MINIMALISTA ---------------- */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 1.2 }}>
        <IconButton
          onClick={() =>
            navigate("/MenuReservas", { state: { fechaSeleccionada } })
          }
          sx={{
            backgroundColor: "#f3f3f3",
            borderRadius: 2,
            "&:hover": { backgroundColor: "#e7e7e7" },
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Typography
          variant="h5"
          sx={{ fontWeight: 700, letterSpacing: 0.2, opacity: 0.9 }}
        >
          Detalle de la Reserva
        </Typography>
      </Box>

      {/* ---------------- DATOS PRINCIPALES ---------------- */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: 26, fontWeight: 700, mb: 1 }}>
          {data.reserva.nombre}
        </Typography>

        <Typography sx={{ fontSize: 15, color: "#666" }}>
          {fechaElegante}
        </Typography>

        <Typography sx={{ fontSize: 15, mt: 0.5, color: "#666" }}>
          {data.reserva.telefono.replace("+591", "")} • {data.reserva.tipo}
        </Typography>

        {data.reserva.comentarios && (
          <Typography sx={{ mt: 1.5, color: "#666" }}>
            <strong>Comentarios:</strong> {data.reserva.comentarios}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* ---------------- PRODUCTOS AGRUPADOS ---------------- */}
      {Object.entries(productosAgrupados).map(([categoria, items]: any) => (
        <Box key={categoria} sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              mb: 2,
              letterSpacing: 0.3,
            }}
          >
            {categoria}
          </Typography>

 {items.map((item: any, i: number) => (
  <Box
    key={i}
    sx={{
      py: { xs: 1.2, sm: 2 },
      px: { xs: 1, sm: 2 },
      borderRadius: 2,
      mb: 1.5,
      "&:hover": { backgroundColor: "rgba(0,0,0,0.03)" },
      width: "100%",
    }}
  >
    {/* CONTENEDOR INTERNO: IZQUIERDA (img+texto) + DERECHA (precio) */}
  {/* CONTENEDOR INTERNO — SOLUCIÓN FINAL FLEXBOX */}
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: 1,
  }}
>
  {/* IMAGEN */}
  <img
    src={
      item.producto.img
        ? item.producto.img.includes("cloudinary")
          ? item.producto.img.replace(
              "/upload/",
              "/upload/f_auto,q_auto,c_fill,w_90,h_90/"
            )
          : item.producto.img
        : ""
    }
    alt=""
    style={{
      width: 65,
      height: 65,
      borderRadius: 12,
      objectFit: "cover",
      flexShrink: 0,        // nunca se achica
    }}
  />

  {/* TEXTO IZQUIERDA — SE ACHICA SI ES NECESARIO */}
  <Box
    sx={{
      flex: 1,              // ocupa todo lo disponible
      minWidth: 0,          // ⭐ permite shrink real (Safari fix)
      overflow: "hidden",
    }}
  >
    <Typography
      sx={{
        fontSize: { xs: 14, sm: 17 },
        fontWeight: 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",   // ⭐ nunca empuja al precio
      }}
    >
      {item.producto.nombre}
    </Typography>

    <Typography
      sx={{
        fontSize: { xs: 12, sm: 14 },
        color: "#6e6e6e",
        whiteSpace: "nowrap",
      }}
    >
      Cantidad: {item.cantidad}
    </Typography>
  </Box>

  {/* PRECIO — ENTRA SIEMPRE */}
  <Box
    sx={{
      flexShrink: 0,
      textAlign: "right",
      pl: 1,
    }}
  >
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: { xs: 15, sm: 18 },
        whiteSpace: "nowrap",
      }}
    >
      Bs. {item.producto.precio * item.cantidad}
    </Typography>
  </Box>
</Box>
  </Box>
))}
        </Box>
      ))}

<Divider sx={{ my: 3 }} />

{/* ---------------- TOTALES ---------------- */}
<Box sx={{ mt: 5 }}>
  {/* TOTAL — destacado, alineado a la derecha */}
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
      px: 1,
    }}
  >
    <Typography
      sx={{
        fontSize: 22,
        fontWeight: 700,
        color: "#c62828",
      }}
    >
      Total
    </Typography>

    <Typography
      sx={{
        fontSize: 22,
        fontWeight: 700,
        color: "#c62828",
        pr: 3,
      }}
    >
      Bs. {subtotal}
    </Typography>
  </Box>

  {/* PAGADO — texto + monto, mismo color, sin negrilla en el monto */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1,
      mt: 1,
    }}
  >
    <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
      Pagado:
    </Typography>

    <Typography
      sx={{
        fontSize: 17,
        fontWeight: 400, // NO en negrilla
        color: "#000",
      }}
    >
      Bs. {pago}
    </Typography>
  </Box>

  {/* SALDO — negro, sin negrilla en el monto */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1,
      mt: 1,
    }}
  >
    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
      Saldo:
    </Typography>

    <Typography
      sx={{
        fontSize: 18,
        fontWeight: 400, // NO en negrilla
        color: "#000",
      }}
    >
      Bs. {saldo}
    </Typography>
  </Box>
</Box>
<Box
  sx={{
    mt: 4,
    px: 1,
    display: "flex",
    justifyContent: "center",
  }}
>
 <Button
  variant="contained"
  startIcon={<PrintIcon />}
  onClick={imprimirCuenta}
  sx={{
    width: "100%",
    maxWidth: { xs: "100%", sm: 520, md: 680 }, // 👈 clave
    height: 48,
    borderRadius: "14px",
    backgroundColor: "rgb(225,63,68)",
    "&:hover": { backgroundColor: "rgb(200,50,55)" },
    textTransform: "none",
    fontWeight: 900,
    fontSize: 15,
    boxShadow: 2,
  }}
>
  Imprimir Cuenta
</Button>
</Box>

<Dialog
  open={openTicket}
  onClose={() => setOpenTicket(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle sx={{ fontWeight: 800 }}>
    Preview Ticket 80mm
  </DialogTitle>

  <DialogContent dividers>
    <Box
      component="pre"
      sx={{
        m: 0,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 12,
        whiteSpace: "pre-wrap",
        lineHeight: 1.2,
      }}
    >
      {ticketText || "No llegó ticket desde el backend."}
    </Box>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setOpenTicket(false)}
      variant="contained"
      sx={{
        backgroundColor: "rgb(225,63,68)",
        "&:hover": { backgroundColor: "rgb(200,50,55)" },
        fontWeight: 800,
        textTransform: "none",
        borderRadius: 2,
      }}
    >
      Cerrar
    </Button>
  </DialogActions>
</Dialog>

{/* ✅ Snackbar automático */}
<Snackbar
  open={snackOpen}
  autoHideDuration={2500}
  onClose={() => setSnackOpen(false)}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
  <Alert
    onClose={() => setSnackOpen(false)}
    severity={snackSeverity}
    variant="filled"
    sx={{ borderRadius: "12px", fontWeight: 900 }}
  >
    {snackMsg}
  </Alert>
</Snackbar>

    </Box>
  );
}

// ---------------- ANIMACIÓN SUAVE ----------------
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);