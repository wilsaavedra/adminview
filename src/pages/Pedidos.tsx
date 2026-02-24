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
  terminos?: string[];
  guarniciones?: string[];
  salsas?: string[];
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
    terminos?: string[];
    guarniciones?: string[];
    salsas?: string[];
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
const [loaded, setLoaded] = useState(false);
  const categoriasFiltradas: CategoriaPedido[] = useMemo(() => {
    if (!rol) return [];
    if (rol === "ADMIN_ROLE") return ["Cocina", "Parrilla", "Bar"];
    if (rol === "COCINA_ROLE") return ["Cocina"];
    if (rol === "BAR_ROLE") return ["Bar"];
    if (rol === "PARRILLA_ROLE" || rol === "PARILLA_ROLE") return ["Parrilla"];
    return [];
  }, [rol]);

  const [error, setError] = useState<string | null>(null);

const cargarPedidos = async () => {
  try {
    setError(null);

    if (!categoriasFiltradas.length) {
      setLoaded(true);
      setPedidos([]);
      return;
    }

    const todas: PedidoBackend[] = [];

    for (const categoria of categoriasFiltradas) {
      const resp = await cafeApi.get<PedidoBackend[]>(`/pedidos/${categoria}`);
      if (Array.isArray(resp.data)) todas.push(...resp.data);
    }

    const mapa: Record<string, PedidoCardGroup> = {};
    const invalidos: any[] = [];

    for (const p of todas) {
      // ✅ GUARDAS: en producción puede venir reserva/producto null
      if (!p || !p._id || !p.categoria || !p.fecha_envio) {
        invalidos.push(p);
        continue;
      }

      const reservaId = (p as any)?.reserva?._id;
      const productoId = (p as any)?.producto?._id;

      if (!reservaId || !productoId) {
        invalidos.push(p);
        continue;
      }

      const key = `${reservaId}-${p.categoria}`;
      const mesa = p.mesa || (p as any)?.reserva?.mesa || "SN";
      const clienteNombre = (p as any)?.reserva?.nombre || "SN";

      if (!mapa[key]) {
        mapa[key] = {
          id: key,
          reservaId,
          categoria: p.categoria,
          mesa,
          clienteNombre,
          fechaEnvio: p.fecha_envio,
          productos: [],
          pedidosIds: [],
        };
      }

      const group = mapa[key];
      group.pedidosIds.push(p._id);

      // fecha más antigua del grupo
      if (new Date(p.fecha_envio).getTime() < new Date(group.fechaEnvio).getTime()) {
        group.fechaEnvio = p.fecha_envio;
      }

      let cat = (p as any)?.producto?.categoria?.nombre
        ? (p as any).producto.categoria.nombre.toUpperCase().trim()
        : "";

      if (!cat) {
        if (group.categoria === "Cocina") cat = "OTROS";
        else if (group.categoria === "Parrilla") cat = "CARNES A LA PARRILLA";
        else cat = "BEBIDAS";
      }

      const terminos = Array.isArray((p as any)?.terminos) ? (p as any).terminos : [];
const guarniciones = Array.isArray((p as any)?.guarniciones) ? (p as any).guarniciones : [];
const salsas = Array.isArray((p as any)?.salsas) ? (p as any).salsas : [];
const existing = group.productos.find((prod) => prod.id === productoId);

if (existing) {
  existing.cantidad += Number((p as any)?.cantidad ?? 1);
  existing.terminos = [...(existing.terminos || []), ...terminos];
  existing.guarniciones = [...(existing.guarniciones || []), ...guarniciones];
  existing.salsas = [...(existing.salsas || []), ...salsas];
} else {
  group.productos.push({
    id: productoId,
    nombre: (p as any)?.producto?.nombre || "Producto",
    cantidad: Number((p as any)?.cantidad ?? 1),
    categoriaNombre: cat,
    terminos,
    guarniciones,
    salsas,
  });
}
    }

    if (invalidos.length) {
      console.warn("⚠️ Pedidos inválidos (reserva/producto null o faltantes):", invalidos);
      // opcional: setError(`Hay ${invalidos.length} pedidos dañados en base de datos.`);
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
      (a, b) => new Date(a.fechaEnvio).getTime() - new Date(b.fechaEnvio).getTime()
    );

    setPedidos(gruposFinal);
  } catch (e: any) {
    console.error("❌ Error cargando pedidos:", e);
    setPedidos([]);
    setError(e?.message || "Error cargando pedidos");
  } finally {
    setLoaded(true);
  }
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
  <Box
    sx={{
      width: "100%",
      bgcolor: "#fff",
      p: { xs: 2, sm: 3 },
    }}
  >
    {/* TÍTULO RESPONSIVO (como Inventarios/Reservas/Cuentas) */}
    <Box
      sx={{
        mb: 1.2,
        pl: { xs: 6, sm: 0 },
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: 20,
          color: "#1e3a8a",
          letterSpacing: 0.2,
          lineHeight: 1.1,
        }}
      >
        Pedidos en curso
      </Typography>
    </Box>

    {/* Subtítulo 
    <Box sx={{ mb: 2, pl: { xs: 6, sm: 0 } }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#6b7280" }}>
        Pedidos en curso
      </Typography>
    </Box>*/}

    {loaded && pedidos.length === 0 && (
      <Typography
        sx={{
          textAlign: "center",
          mt: 5,
          color: "#777",
          fontSize: "1.1rem",
          px: 2,
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
        height: "auto",
        minHeight: "auto",
        overflow: "visible !important",
        gridAutoRows: "max-content",
        gridAutoFlow: "row",
        px: { xs: 0, sm: 0, md: 0 },
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
              width: "100%",
              maxWidth: "100%",
              flexShrink: 1,
              height: "auto",
              boxSizing: "border-box",
              transition: "all 0.3s ease",
              opacity: removing === group.id ? 0 : 1,
              transform: removing === group.id ? "scale(0.85)" : "scale(1)",
              filter: removing === group.id ? "blur(4px) saturate(200%)" : "none",
              border: "1px solid rgba(0,0,0,0.08)", // ✅ como tablas/cajas de otras pantallas
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
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: colors.text,
                      letterSpacing: 0.2,
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
                        "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
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
                    fontWeight: 700,
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
                    alignItems: "flex-start",
                    gap: 0.4,
                    px: 1,
                    py: 0.4,
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                    mb: 0.5,
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      minWidth: 18,
                      textAlign: "left",
                      color: "#111827",
                    }}
                  >
                    {prod.cantidad}
                  </Typography>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.3,
                        color: "#111827",
                      }}
                    >
                      {prod.nombre}

                      {group.categoria === "Parrilla" &&
                      prod.terminos &&
                      prod.terminos.length > 0
                        ? ` (${prod.terminos.map((t) => String(t).toLowerCase()).join(", ")})`
                        : ""}

                      {group.categoria === "Cocina" &&
                      String(prod.categoriaNombre || "").toUpperCase().trim() === "PASTAS" &&
                      prod.salsas &&
                      prod.salsas.length > 0
                        ? ` (${prod.salsas.map((s) => String(s).toLowerCase()).join(", ")})`
                        : ""}
                    </Typography>

                    {group.categoria === "Parrilla" &&
                      prod.guarniciones &&
                      prod.guarniciones.length > 0 && (
                        <Box sx={{ mt: 0.2, ml: 1.1 }}>
                          {prod.guarniciones.map((g, idx) => (
                            <Typography
                              key={`${prod.id}-g-${idx}`}
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "#555",
                                lineHeight: 1.15,
                                fontWeight: 700,
                              }}
                            >
                              {`>${String(g).toUpperCase()}`}
                            </Typography>
                          ))}
                        </Box>
                      )}
                  </Box>
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