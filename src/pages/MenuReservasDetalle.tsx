import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import cafeApi from "../api/cafeApi";

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
    px: { xs: 1.5, sm: 2, md: 4 },   // móvil sin empujar
    py: 3,
    width: "100%",
    maxWidth: 1100,
    mx: "auto",
    mb: 10,
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
    display: "flex",
    alignItems: "center",
    py: { xs: 1.2, sm: 2 },
    px: { xs: 1, sm: 2 },
    borderRadius: 2,
    mb: 1.5,
    gap: { xs: 1, sm: 2 },
    "&:hover": { backgroundColor: "rgba(0,0,0,0.03)" },
    flexWrap: { xs: "wrap", sm: "nowrap" }, // ⭐ permite dos líneas solo en móvil
    width: "100%",
  }}
>
  {/* IMAGEN RESPONSIVA */}
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
      width: "65px",
      height: "65px",
      borderRadius: 12,
      objectFit: "cover",
      flexShrink: 0,
    }}
  />

  {/* NOMBRE + CANTIDAD */}
  <Box sx={{ flex: 1, minWidth: "55%" }}>
    <Typography sx={{ fontSize: { xs: 14, sm: 17 }, fontWeight: 600 }}>
      {item.producto.nombre}
    </Typography>

    <Typography sx={{ fontSize: { xs: 12, sm: 14 }, color: "#6e6e6e" }}>
      Cantidad: {item.cantidad}
    </Typography>
  </Box>

  {/* PRECIO QUE SIEMPRE ENTRA EN PANTALLA */}
  <Box
    sx={{
      minWidth: { xs: 70, sm: 120 }, // ⭐ más pequeño en móvil
      textAlign: "right",
      pr: { xs: 1, sm: 2 },
      flexShrink: 1, // ⭐ permite reducir para no salirse
    }}
  >
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: { xs: 14.5, sm: 18 },
      }}
    >
      Bs. {item.producto.precio * item.cantidad}
    </Typography>
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