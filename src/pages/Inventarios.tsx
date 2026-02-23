// src/pages/Inventarios.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  TableContainer,
  Divider,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import cafeApi from "../api/cafeApi";

type Categoria = { _id: string; nombre: string };

type ProductoInv = {
  _id: string;
  nombre: string;
  cantidad: number;
  umbral: number;
};

type Tx = {
  _id: string;
  tipo: "ALTA" | "BAJA";
  cantidad: number;
  motivo?: string;
  fecha: string;
  origen: "MANUAL" | "PEDIDO";
  usuario?: { nombre?: string };
};

const BRAND_RED = "#e13f44";
const TITLE_BLUE = "#1e3a8a";
const SOFT_LILAC = "#f3ecff";
const LILAC_TEXT = "#6d28d9";

function firstName(nombre?: string) {
  const n = String(nombre || "").trim();
  if (!n) return "-";
  return n.split(/\s+/)[0] || "-";
}

const Inventarios: React.FC = () => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [productos, setProductos] = useState<ProductoInv[]>([]);
  const [loading, setLoading] = useState(false);

  // inputs por producto
  const [nuevoValor, setNuevoValor] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState<Record<string, string>>({});

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string>("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "warning" | "info">(
    "success"
  );

  const showSnack = (msg: string, severity: typeof snackSeverity = "success") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  // modal historial
  const [openHist, setOpenHist] = useState(false);
  const [histProducto, setHistProducto] = useState<ProductoInv | null>(null);
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [hasta, setHasta] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hist, setHist] = useState<Tx[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const nombreCategoria = useMemo(() => {
    const c = categorias.find((x) => x._id === categoriaId);
    return c?.nombre || "";
  }, [categorias, categoriaId]);

  const cargarCategorias = async () => {
    const resp = await cafeApi.get("/categorias?limite=300&desde=0");
    const cats: Categoria[] = resp.data?.categorias || [];
    setCategorias(cats);

    const entradas = cats.find((c) => String(c.nombre).toUpperCase().trim() === "ENTRADAS");
    setCategoriaId((entradas?._id || cats[0]?._id) ?? "");
  };

  const cargarProductos = async (catId: string) => {
    if (!catId) return;
    setLoading(true);
    try {
      const resp = await cafeApi.get(`/inventarios?categoriaId=${catId}`);
      setProductos(Array.isArray(resp.data?.productos) ? resp.data.productos : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (categoriaId) cargarProductos(categoriaId);
  }, [categoriaId]);

  const handleMovimiento = async (productoId: string, tipo: "ALTA" | "BAJA") => {
    const raw = (nuevoValor[productoId] || "").trim();
    const qty = Number(raw);

    if (!raw || Number.isNaN(qty) || qty <= 0) {
      showSnack("Ingresa un valor válido mayor a 0.", "warning");
      return;
    }

    const mot = (motivo[productoId] || "").trim();

    try {
      const resp = await cafeApi.post("/inventarios/movimiento", {
        productoId,
        tipo,
        cantidad: qty,
        motivo: mot,
      });

      const nuevaCantidad = resp.data?.producto?.cantidad;
      if (typeof nuevaCantidad === "number") {
        setProductos((prev) =>
          prev.map((p) => (p._id === productoId ? { ...p, cantidad: nuevaCantidad } : p))
        );
      }

      // limpiar inputs
      setNuevoValor((prev) => ({ ...prev, [productoId]: "" }));
      setMotivo((prev) => ({ ...prev, [productoId]: "" }));

      showSnack(`${tipo} registrada correctamente.`, "success");

      // si el modal está abierto para ese mismo producto, refrescamos historial (opcional pero útil)
      if (openHist && histProducto?._id === productoId) {
        await cargarHistorial(productoId);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.msg ||
        e?.response?.data?.message ||
        "No se pudo registrar el movimiento.";
      showSnack(msg, "error");
    }
  };

  const cargarHistorial = async (productoId: string) => {
    setLoadingHist(true);
    try {
      const resp = await cafeApi.get(
        `/inventarios/transacciones/${productoId}?desde=${desde}&hasta=${hasta}`
      );
      setHist(Array.isArray(resp.data?.transacciones) ? resp.data.transacciones : []);
    } finally {
      setLoadingHist(false);
    }
  };

  const abrirHistorial = async (p: ProductoInv) => {
    setHistProducto(p);
    setOpenHist(true);
    await cargarHistorial(p._id);
  };

  const cerrarHistorial = () => {
    setOpenHist(false);
  };

  return (
   <Box sx={{ width: "100%" }}>
  {/* Título */}
  <Box
    sx={{
      mb: 1.2,
      pl: { xs: 6, sm: 0 }, // ✅ padding-left en móvil (evita choque con hamburguesa)
    }}
  >
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: 20,
        color: TITLE_BLUE,
        letterSpacing: 0.2,
        lineHeight: 1.1,
      }}
    >
      Inventarios
    </Typography>
  </Box>

      {/* Top controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          flexWrap: "wrap",
          mb: 1.5,
        }}
      >
        <FormControl size="small" sx={{ minWidth: isSmDown ? 220 : 280 }}>
          <InputLabel>Categoría</InputLabel>
       <Select
  label="Categoría"
  value={categoriaId}
  onChange={(e) => setCategoriaId(String(e.target.value))}
  MenuProps={{
    PaperProps: {
      sx: {
        maxHeight: "60vh",
      },
    },
    anchorOrigin: {
      vertical: "bottom",
      horizontal: "left",
    },
    transformOrigin: {
      vertical: "top",
      horizontal: "left",
    },
  }}
>
            {categorias.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Refrescar">
          <span>
            <IconButton
              size="small"
              onClick={() => categoriaId && cargarProductos(categoriaId)}
              disabled={loading || !categoriaId}
              sx={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 2,
                width: 36,
                height: 36,
                bgcolor: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
              }}
            >
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Tabla */}
      <Box
        sx={{
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "#fff",
        }}
      >
        {loading ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: BRAND_RED,
                    "& th": {
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      py: 1.1,
                      borderBottom: "none",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableCell sx={{ width: 52 }}>#</TableCell>
                  <TableCell sx={{ width: 360 }}>Nombre</TableCell>
                  <TableCell sx={{ width: 90, textAlign: "right" }}>Stock</TableCell>
                  <TableCell sx={{ width: 90, textAlign: "right" }}>Nuevo</TableCell>
                  <TableCell sx={{ width: 360 }}>Motivo</TableCell>
                  <TableCell sx={{ width: 64 }} align="center">
                    Alta
                  </TableCell>
                  <TableCell sx={{ width: 64 }} align="center">
                    Baja
                  </TableCell>
                  <TableCell sx={{ width: 64 }} align="center">
                    Hist.
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {productos.map((p, idx) => {
                  const umbral = Number(p.umbral ?? 1);
                  const cant = Number(p.cantidad ?? 0);
                  const enRiesgo = umbral > 1 && cant < umbral;
                  const zebra = idx % 2 === 0 ? "#ffffff" : "#fafafa";

                  return (
                    <TableRow
                      key={p._id}
                      sx={{
                        bgcolor: enRiesgo ? "#fff3e0" : zebra,
                        "& td": {
                          fontWeight: 400,
                          fontSize: 13,
                          color: "#111827",
                          py: 0.95,
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        },
                        "&:hover": {
                          bgcolor: enRiesgo ? "#ffe7c2" : "rgba(0,0,0,0.03)",
                        },
                      }}
                    >
                      <TableCell sx={{ color: "#6b7280" }}>{idx + 1}</TableCell>

                      <TableCell
                        sx={{
                          textTransform: "uppercase",
                          letterSpacing: 0.15,
                          whiteSpace: "normal",
                          lineHeight: 1.25,
                          pr: 2,
                        }}
                      >
                        {p.nombre}
                      </TableCell>

                     <TableCell sx={{ textAlign: "right" }}>
  <Typography sx={{ fontSize: 13 }}>{cant}</Typography>
</TableCell>

                      <TableCell sx={{ textAlign: "right" }}>
                        <TextField
                          size="small"
                          value={nuevoValor[p._id] ?? ""}
                          onChange={(e) =>
                            setNuevoValor((prev) => ({ ...prev, [p._id]: e.target.value }))
                          }
                          placeholder="0"
                          inputProps={{
                            inputMode: "numeric",
                            style: { textAlign: "right" },
                          }}
                          sx={{
                            width: 72,
                            "& .MuiOutlinedInput-root": { height: 34, bgcolor: "#fff" },
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={motivo[p._id] ?? ""}
                          onChange={(e) =>
                            setMotivo((prev) => ({ ...prev, [p._id]: e.target.value }))
                          }
                          placeholder="Ej: compra, ajuste, merma..."
                          sx={{
                            "& .MuiOutlinedInput-root": { height: 34, bgcolor: "#fff" },
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Registrar Alta">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleMovimiento(p._id, "ALTA")}
                              sx={{
                                color: "#16a34a",
                                "&:hover": { bgcolor: "rgba(22,163,74,0.10)" },
                              }}
                            >
                              <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Dar de Baja">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleMovimiento(p._id, "BAJA")}
                              sx={{
                                color: "#dc2626",
                                "&:hover": { bgcolor: "rgba(220,38,38,0.10)" },
                              }}
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Ver historial">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => abrirHistorial(p)}
                              sx={{
                                color: "#2563eb",
                                "&:hover": { bgcolor: "rgba(37,99,235,0.10)" },
                              }}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {productos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#6b7280" }}>
                      No hay productos en esta categoría.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* MODAL HISTORIAL */}
      <Dialog
        open={openHist}
        onClose={cerrarHistorial}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            m: 0,
            py: 1.6,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 16,
              color: "#111827",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={histProducto?.nombre || ""}
          >
            Historial:{" "}
            <Box component="span" sx={{ color: TITLE_BLUE, fontWeight: 900 }}>
              {histProducto?.nombre || ""}
            </Box>
          </Typography>

          <IconButton
            onClick={cerrarHistorial}
            size="small"
            sx={{ color: "#6b7280", "&:hover": { bgcolor: "rgba(0,0,0,0.06)" } }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              flexWrap: "wrap",
              mb: 1.6,
            }}
          >
            <TextField
              size="small"
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              sx={{ minWidth: 180 }}
            />

            <TextField
              size="small"
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              sx={{ minWidth: 180 }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="button"
                onClick={() => histProducto && cargarHistorial(histProducto._id)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  background: BRAND_RED,
                  color: "#fff",
                  fontWeight: 800,
                  padding: "8px 18px",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                }}
              >
                Buscar
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: "100%",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.08)",
              bgcolor: "#fff",
            }}
          >
            {loadingHist ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 820 }}>
                 <TableHead>
                    <TableRow
                        sx={{
                        bgcolor: SOFT_LILAC,
                        "& th": {
                            color: LILAC_TEXT,
                            fontWeight: 800,
                            fontSize: 13,
                            py: 1.0,
                            borderBottom: "none",
                            whiteSpace: "nowrap",
                        },
                        }}
                    >
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>Cantidad</TableCell>
                        <TableCell>Origen</TableCell>
                        <TableCell>Motivo</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>Usuario</TableCell>
                    </TableRow>
                    </TableHead>

                  <TableBody>
                    {hist.map((t, i) => (
                      <TableRow
                        key={t._id}
                        sx={{
                          bgcolor: i % 2 === 0 ? "#fff" : "#fafafa",
                          "& td": {
                            fontWeight: 400,
                            fontSize: 13,
                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                          },
                        }}
                      >
                       <TableCell>
                            {new Date(t.fecha).toLocaleString("es-BO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            })}
                            </TableCell>
                            <TableCell>{t.tipo}</TableCell>
                            <TableCell sx={{ textAlign: "right" }}>{t.cantidad}</TableCell>
                            <TableCell>{t.origen}</TableCell>
                            <TableCell>{t.motivo || ""}</TableCell>
                            <TableCell sx={{ textAlign: "right", color: "#6b7280" }}>
                            {firstName(t.usuario?.nombre)}
                            </TableCell>
                      </TableRow>
                    ))}

                    {hist.length === 0 && (
                      <TableRow>
                     <TableCell colSpan={6} sx={{ textAlign: "center", py: 3, color: "#6b7280" }}>
                        Sin transacciones en el rango.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2600}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          variant="filled"
          sx={{
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventarios;