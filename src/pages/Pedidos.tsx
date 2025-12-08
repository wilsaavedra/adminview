// src/pages/Pedidos.tsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import OutdoorGrillIcon from "@mui/icons-material/OutdoorGrill";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import cafeApi from "../api/cafeApi";
import { AuthContext } from "../context/AuthContext";

type CategoriaPedido = "Cocina" | "Parrilla" | "Bar";

interface PedidoBackend {
  _id: string;
  reserva: {
    _id: string;
    nombre: string;
    mesa?: string;
    fecha: string;
  };
  producto: {
    _id: string;
    nombre: string;
    categoria?: { nombre: string };
  };
  cantidad: number;
  categoria: CategoriaPedido;
  mesa?: string;
  fecha_envio: string;
}

interface PedidoCardGroup {
  id: string;
  reservaId: string;
  categoria: CategoriaPedido;
  mesa: string;
  clienteNombre: string;
  fechaEnvio: string;
  productos: {
    id: string;
    nombre: string;
    cantidad: number;
    categoriaNombre?: string;
  }[];
  pedidosIds: string[];
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const diffMinutesFromNow = (iso: string) => {
  const now = Date.now();
  const t = new Date(iso).getTime();
  return (now - t) / 60000;
};

const getCategoriaIcon = (categoria: CategoriaPedido) => {
  switch (categoria) {
    case "Cocina":
      return <RestaurantIcon fontSize="small" />;
    case "Parrilla":
      return <OutdoorGrillIcon fontSize="small" />;
    case "Bar":
      return <LocalBarIcon fontSize="small" />;
    default:
      return null;
  }
};

const getHeaderColors = (group: PedidoCardGroup) => {
  const minutos = diffMinutesFromNow(group.fechaEnvio);
  const limite = group.categoria === "Bar" ? 10 : 30;
  const retrasado = minutos >= limite;

  if (retrasado) {
    return { bg: "#ffe0ec", border: "1px solid #f48fb1", text: "#b00020" };
  }

  return { bg: "#e3f7e4", border: "1px solid #a5d6a7", text: "#1b5e20" };
};

const Pedidos: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState<PedidoCardGroup[]>([]);
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const rol = user?.rol as string | undefined;

  const categoriasFiltradas: CategoriaPedido[] = useMemo(() => {
    if (!rol) return [];
    if (rol === "ADMIN_ROLE") return ["Cocina", "Parrilla", "Bar"];
    if (rol === "COCINA_ROLE") return ["Cocina"];
    if (rol === "BAR_ROLE") return ["Bar"];
    if (rol === "PARRILLA_ROLE" || rol === "PARILLA_ROLE") return ["Parrilla"];
    return [];
  }, [rol]);

  const cargarPedidos = async () => {
    if (!categoriasFiltradas.length) return;

    const todas: PedidoBackend[] = [];

    for (const categoria of categoriasFiltradas) {
      const resp = await cafeApi.get<PedidoBackend[]>(`/pedidos/${categoria}`);
      todas.push(...resp.data);
    }

    const mapa: Record<string, PedidoCardGroup> = {};

    for (const p of todas) {
      const key = `${p.reserva._id}-${p.categoria}`;
      const mesa = p.mesa || p.reserva.mesa || "SN";

      if (!mapa[key]) {
        mapa[key] = {
          id: key,
          reservaId: p.reserva._id,
          categoria: p.categoria,
          mesa,
          clienteNombre: p.reserva.nombre,
          fechaEnvio: p.fecha_envio,
          productos: [],
          pedidosIds: [],
        };
      }

      const group = mapa[key];
      group.pedidosIds.push(p._id);

      if (
        new Date(p.fecha_envio).getTime() <
        new Date(group.fechaEnvio).getTime()
      ) {
        group.fechaEnvio = p.fecha_envio;
      }

      let cat = p.producto.categoria?.nombre
        ? p.producto.categoria.nombre.toUpperCase().trim()
        : "";

      if (!cat) {
        if (group.categoria === "Cocina") cat = "OTROS";
        else if (group.categoria === "Parrilla") cat = "CARNES A LA PARRILLA";
        else cat = "BEBIDAS";
      }

      const existing = group.productos.find(
        (prod) => prod.id === p.producto._id
      );

      if (existing) {
        existing.cantidad += Number(p.cantidad ?? 1);
      } else {
        group.productos.push({
          id: p.producto._id,
          nombre: p.producto.nombre,
          cantidad: Number(p.cantidad ?? 1),
          categoriaNombre: cat,
        });
      }
    }

    const ORDER = [
      "ENTRADAS",
      "ENSALADAS",
      "PASTAS",
      "GUARNICIONES EXTRAS",
      "OTROS",
      "SALSAS EXTRAS",
      "POSTRES",
      "CARNES A LA PARRILLA",
      "BEBIDAS",
      "BAR",
    ];

    Object.values(mapa).forEach((group) => {
      group.productos.sort((a, b) => {
        const A = ORDER.indexOf(a.categoriaNombre || "");
        const B = ORDER.indexOf(b.categoriaNombre || "");
        return (A === -1 ? 999 : A) - (B === -1 ? 999 : B);
      });
    });

    const gruposFinal = Object.values(mapa).sort(
      (a, b) =>
        new Date(a.fechaEnvio).getTime() - new Date(b.fechaEnvio).getTime()
    );

    setPedidos(gruposFinal);
  };

  useEffect(() => {
    cargarPedidos();
  }, [categoriasFiltradas.length]);

  const handleCompletarGrupo = async (group: PedidoCardGroup) => {
    setLoadingGroupId(group.id);
    setRemoving(group.id);

    await new Promise((r) => setTimeout(r, 300));

    await Promise.all(
      group.pedidosIds.map((id) => cafeApi.put(`/pedidos/entregar/${id}`))
    );

    setPedidos((prev) => prev.filter((g) => g.id !== group.id));
    setLoadingGroupId(null);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 2, px: { xs: 1.5, sm: 0 } }}
      >
        Pedidos en curso
      </Typography>
{pedidos.length === 0 && (
  <Typography
    sx={{
      textAlign: "center",
      mt: 5,
      color: "#777",
      fontSize: "1.1rem",
      px: 2
    }}
  >
    No hay pedidos pendientes.
  </Typography>
)}
 <Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, 1fr)",
      md: "repeat(3, 1fr)",
    },
    gap: { xs: 2, md: 3 },
    alignItems: "start",
    width: "100%",

    // 🔥 PUNTO CRÍTICO: permitir crecimiento infinito
    height: "auto",
    minHeight: "auto",

    // 🔥 ELIMINA SCROLL INTERNO
    overflow: "visible !important",

    // 🔥 Evita que grid recorte contenido
    gridAutoRows: "max-content",
    gridAutoFlow: "row",

    px: { xs: 0.5, sm: 0, md: 0 },
  }}
>
        {pedidos.map((group) => {
          const colors = getHeaderColors(group);

          return (
 <Card
  key={group.id}
  elevation={3}
  sx={{
    position: "relative",
    zIndex: 2,
    borderRadius: 3,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    bgcolor: "#ffffff",

    width: "100%",        // ⭐ SE AJUSTA A SU COLUMNA
    maxWidth: "100%",     // ⭐ NO CRECE MÁS NUNCA
    flexShrink: 1,        // ⭐ EVITA DESBORDE
    height: "auto",       // ⭐ NATURAL

    boxSizing: "border-box",
    transition: "all 0.3s ease",
    opacity: removing === group.id ? 0 : 1,
    transform: removing === group.id ? "scale(0.85)" : "scale(1)",
    filter:
      removing === group.id
        ? "blur(4px) saturate(200%)"
        : "none",
  }}
>
              {/* HEADER */}
              <Box
                sx={{
                  bgcolor: colors.bg,
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.6,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getCategoriaIcon(group.categoria)}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: colors.text,
                      }}
                    >
                      Mesa {group.mesa}
                    </Typography>
                  </Box>

                  <Tooltip title="Marcar como entregado">
                    <span>
                      <IconButton
                        size="small"
                        disabled={loadingGroupId === group.id}
                        onClick={() => handleCompletarGrupo(group)}
                        sx={{
                          color: colors.text,
                          "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        {loadingGroupId === group.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <CheckCircleIcon />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#555" }}>
                    {formatDateTime(group.fechaEnvio)}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      maxWidth: "50%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#555",
                      fontWeight: 600,
                    }}
                  >
                    {group.clienteNombre}
                  </Typography>
                </Box>
              </Box>

              {/* BODY */}
  <CardContent sx={{ flexGrow: 1, bgcolor: "#fff", py: 1 }}>
  {group.productos.map((prod) => (
    <Box
      key={prod.id}
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",     // 🔥 alineación perfecta
        gap: 0.4,                 // 🔥 MUCHO MENOS ESPACIO ENTRE CANTIDAD Y NOMBRE
        px: 1,
        py: 0.4,
        borderRadius: 2,
        bgcolor: "#ffffff",
        mb: 0.5,
        width: "100%",
      }}
    >
      {/* CANTIDAD */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          minWidth: 18,           // 🔥 más pequeño, justo lo necesario
          textAlign: "left",
        }}
      >
        {prod.cantidad}
      </Typography>

      {/* NOMBRE DEL PRODUCTO */}
      <Typography
        variant="body2"
        sx={{
          flexGrow: 1,
          fontWeight: 500,

          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.3,
        }}
      >
        {prod.nombre}
      </Typography>
    </Box>
  ))}
</CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default Pedidos;