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
  Grid,
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
  };
  cantidad: number;
  categoria: CategoriaPedido;
  mesa?: string;
  fecha_envio: string;
}

interface PedidoCardGroup {
  id: string; // reserva + categoria
  reservaId: string;
  categoria: CategoriaPedido;
  mesa: string;
  clienteNombre: string;
  fechaEnvio: string;
  productos: {
    id: string;
    nombre: string;
    cantidad: number;
  }[];
  pedidosIds: string[]; // todos los _id de Pedido que agrupa esta tarjeta
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

const Pedidos: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState<PedidoCardGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null); // para animación futurista
  const [error, setError] = useState<string | null>(null);

  const rol = user?.rol as string | undefined;

  // Qué categorías ve según el rol
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

    try {
      setLoading(true);
      setError(null);

      const todas: PedidoBackend[] = [];

      // Traemos /pedidos/:categoria según rol
      for (const categoria of categoriasFiltradas) {
        const resp = await cafeApi.get<PedidoBackend[]>(`/pedidos/${categoria}`);
        todas.push(...resp.data);
      }

      // Agrupar por reserva + categoría
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

        // Usar la hora más antigua como referencia
        if (
          new Date(p.fecha_envio).getTime() <
          new Date(group.fechaEnvio).getTime()
        ) {
          group.fechaEnvio = p.fecha_envio;
        }

        group.pedidosIds.push(p._id);

        // Agrupar productos iguales sumando cantidad
        const existing = group.productos.find(
          (prod) => prod.id === p.producto._id
        );
        if (existing) {
          existing.cantidad += p.cantidad ?? 1;
        } else {
          group.productos.push({
            id: p.producto._id,
            nombre: p.producto.nombre,
            cantidad: p.cantidad ?? 1,
          });
        }
      }

      const gruposOrdenados = Object.values(mapa).sort(
        (a, b) =>
          new Date(a.fechaEnvio).getTime() - new Date(b.fechaEnvio).getTime()
      );

      setPedidos(gruposOrdenados);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriasFiltradas.length]);

  const handleCompletarGrupo = async (group: PedidoCardGroup) => {
    try {
      setLoadingGroupId(group.id);

      // Disparar animación tipo "desvanecer futurista"
      setRemoving(group.id);
      await new Promise((res) => setTimeout(res, 300)); // la duración debe coincidir con la transición CSS

      // Marcar todos los pedidos del grupo como entregados en backend
      await Promise.all(
        group.pedidosIds.map((id) =>
          cafeApi.put(`/pedidos/entregar/${id}`)
        )
      );

      // Remover del estado
      setPedidos((prev) => prev.filter((g) => g.id !== group.id));
    } catch (err) {
      console.error("Error marcando como entregado:", err);
      setError("Error al marcar el pedido como entregado.");
    } finally {
      setLoadingGroupId(null);
    }
  };

  const getHeaderColors = (group: PedidoCardGroup) => {
    const minutos = diffMinutesFromNow(group.fechaEnvio);
    const limite = group.categoria === "Bar" ? 10 : 30;
    const retrasado = minutos >= limite;

    if (retrasado) {
      return {
        bg: "#ffe0ec",
        border: "1px solid #f48fb1",
        text: "#b00020",
      };
    }

    return {
      bg: "#e3f7e4",
      border: "1px solid #a5d6a7",
      text: "#1b5e20",
    };
  };

  if (!categoriasFiltradas.length) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <ErrorOutlineIcon sx={{ fontSize: 40, color: "#999" }} />
        <Typography variant="h6" color="text.secondary">
          Tu rol no tiene acceso a la vista de pedidos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: "100%",
        bgcolor: "#f5f5f7",
        minHeight: "100%",
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Pedidos en curso
        </Typography>
      </Box>

      {error && (
        <Typography sx={{ mb: 2, color: "red" }}>{error}</Typography>
      )}

      {loading && (
        <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !error && pedidos.length === 0 && (
        <Typography sx={{ mt: 4, textAlign: "center", color: "#777" }}>
          No hay pedidos pendientes.
        </Typography>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {pedidos.map((group) => {
          const colors = getHeaderColors(group);
          const minutos = diffMinutesFromNow(group.fechaEnvio);
          const limite = group.categoria === "Bar" ? 10 : 30;
          const retrasado = minutos >= limite;

          return (
           <Grid key={group.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  bgcolor: "#ffffff",
                  transition: "all 0.3s ease",
                  opacity: removing === group.id ? 0 : 1,
                  transform:
                    removing === group.id ? "scale(0.85)" : "scale(1)",
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
                    borderTop: colors.border,
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
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
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
                            bgcolor: "rgba(255,255,255,0.7)",
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

                  <Typography variant="caption" sx={{ color: "#555" }}>
                    {formatDateTime(group.fechaEnvio)}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: retrasado ? "#b00020" : "#1b5e20",
                      fontWeight: 600,
                    }}
                  >
                    {Math.floor(minutos)} min · límite {limite}'
                  </Typography>

                  <Typography variant="caption" sx={{ color: "#555" }}>
                    {group.clienteNombre}
                  </Typography>
                </Box>

                {/* BODY */}
                <CardContent sx={{ flexGrow: 1, bgcolor: "#fff", py: 1.5 }}>
                  {group.productos.map((prod) => (
                    <Box
                      key={prod.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.6,
                        bgcolor: "rgba(248,248,250,0.95)",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, minWidth: 32 }}
                      >
                        x{prod.cantidad}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          flexGrow: 1,
                          ml: 1,
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {prod.nombre}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Pedidos;