import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Producto,
  ProductsResponse,
  Categoria,
  Reservas,
  ReservasResponse,
  Producto1,
  MenuReservas,
  MenuResponse,
  Favoritos,
  FavoritosResponse,
} from "../interfaces/appInterfaces";
import cafeApi from "../api/cafeApi";
import { AuthContext } from "./AuthContext";

type sIcon = {
  sIcons: "mostrar" | "ocultar";
};

interface CheckboxStates {
  [key: string]: boolean;
}

interface CantidadState {
  [key: string]: number;
}

interface selectedProducts {
  codigo: string;
  cantidad: number;
  radioValues: { [key: number]: string };
  guarnicion: { [key: number]: string };
  salsa: { [key: number]: string };
  imagen: string;
}

type ProductsContextProps = {
  products: Producto[];
  loadProducts: () => Promise<void>;
  addProduct: (categoryId: string, productName: string) => Promise<Producto>;
  updateProduct: (categoryId: string, productName: string, productId: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  loadProductById: (id: string) => Promise<Producto>;
  uploadImage: (data: any, id: string) => Promise<void>;
  loadCategoriaById: (id: string) => Promise<Categoria>;
  showIcon: string;
  mostrarIcon: (id: string) => void;
  cantCompras: number;
  calcCompras: (id: number) => void;
  handleMostrarSeleccion: (state: CheckboxStates, cant: CantidadState, tipo: selectedProducts[]) => void;
  result: Producto[];

  // Reservas
  addReserva: (cantidad: number, fecha: Date, tipo: string) => Promise<Reservas>;
  mostrarModal: (id: string) => void;
  modalVisible: boolean;
  modalVisible2: boolean;
  visibleR: boolean;

  vBuscar: boolean;
  reservas: Reservas[];
  loadReservas: () => Promise<void>;
  deleteReserva: (id: string) => Promise<void>;
  cantReservas: number;

  menuReserva: (id: string, cantidad: number, fecha: string, tipo: string) => void;
  idReserva: string;
  cantidadReserva: number;
  fechaReserva: string;
  tipoReserva: string;

  addMenuReserva: (reserva: string, arregloMenuReserva: Producto1[]) => Promise<MenuReservas>;
  updateMenuReserva: (reserva: string, arregloMenuReserva: Producto1[]) => Promise<void>;
  menureservas: MenuReservas[];
  loadMReservas: () => Promise<void>;
  mreservas: MenuReservas[];

  actualizarResult: (arreglomr: Producto[]) => void;
  grabarMenuReserva: () => Promise<void>;

  vSnack: boolean;
  searchText: string;
  hasPendiente: boolean;

  mostrarSearch: (id: string) => void;
  mostrarVBuscar: (id: boolean) => void;

  loadFavorito: (user: string, product: string) => Promise<Favoritos>;
  crearFavorito: (user: string, product: string) => Promise<Favoritos>;
  actualizarFavorito: (id: string, favorite: boolean) => Promise<Favoritos>;
  obtenerFavoritos: (user: string) => Promise<void>;
  favoritos: Producto[];

  // QR
  generarQRPago: (monto: number) => Promise<{ qrImg: string; qrId: number }>;
  verificarEstadoQRPago: (qrId: number) => Promise<"pagado" | "pendiente">;

  // Reglas de modal
  ensureModalRule: () => void;
  closeModalSafely: () => void;
};

export const ProductsContext = createContext({} as ProductsContextProps);

export const ProductsProvider = ({ children }: any) => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [showIcon, setShowIcon] = useState<string>("ocultar");
  const [cantCompras, setCantCompras] = useState(0);
  const [cantReservas, setCantReservas] = useState(0);
  const [cantidadStates, setCantidadStates] = useState<CantidadState>({});
  const [checkboxStates, setCheckboxStates] = useState<CheckboxStates>({});
  const [result, setResult] = useState<Producto[]>([]);
  const [reservas, setReservas] = useState<Reservas[]>([]);
  const [hasPendiente, setHasPendiente] = useState(false);

  const [mreservas, setMReservas] = useState<MenuReservas[]>([]);
  const [cantMReservas, setCantMReservas] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [visibleR, setVisibleR] = useState(false);

  const [vBuscar, setVBuscar] = useState(false);

  const [idReserva, setIdReserva] = useState("");
  const [cantidadReserva, setCantidadReserva] = useState(0);
  const [fechaReserva, setFechaReserva] = useState("Escoger Reserva");
  const [tipoReserva, setTipoReserva] = useState("Resto");

  const [menureservas, setMenuReservas] = useState<MenuReservas[]>([]);
  const [existeFavorito, setExisteFavorito] = useState(false);

  const { user, status } = useContext(AuthContext);

  const [vSnack, setVSnack] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [favoritos, setFavoritos] = useState<Producto[]>([]);
const [reservasListas, setReservasListas] = useState(false);
  const [reservasCargadasUnaVez, setReservasCargadasUnaVez] = useState(false);

  // 🔒 Supresión temporal de auto-apertura para evitar “parpadeo”
  const suppressAutoOpenRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
let reservasYaMostradas = false;
const [allowAutoModal, setAllowAutoModal] = useState(true);
  // --- Helpers de supresión ---
  const startSuppress = (ms = 900) => {
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressAutoOpenRef.current = true;
    suppressTimerRef.current = setTimeout(() => {
      suppressAutoOpenRef.current = false;
      suppressTimerRef.current = null;
    }, ms);
  };

  // Cerrar modal de forma “segura”: activa supresión y cierra
  const closeModalSafely = () => {
    startSuppress();
    setModalVisible(false);
    setModalVisible2(false);
    setVisibleR(false);
  };

  // ---- Cargas iniciales ----
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user && (user._id || user.uid) && !reservasCargadasUnaVez) {
      loadReservas().finally(() => setReservasCargadasUnaVez(true));
    }
  }, [status, user, reservasCargadasUnaVez]);

  // ---- Productos ----
  const loadProducts = async () => {
    const resp = await cafeApi.get<ProductsResponse>("/productos?limite=200");
    setProducts([...resp.data.productos]);
  };

  const addProduct = async (categoryId: string, productName: string): Promise<Producto> => {
    const resp = await cafeApi.post<Producto>("/productos", {
      nombre: productName,
      categoria: categoryId,
    });
    setProducts([...products, resp.data]);
    return resp.data;
  };

  const updateProduct = async (categoryId: string, productName: string, productId: string) => {
    const resp = await cafeApi.put<Producto>(`/productos/${productId}`, {
      nombre: productName,
      categoria: categoryId,
    });
    setProducts(
      products.map((prod) => {
        return prod._id === productId ? resp.data : prod;
      })
    );
  };

  const deleteProduct = async (id: string) => {
    // no-op (mantienes tu implementación vacía)
  };

  const loadProductById = async (id: string): Promise<Producto> => {
    const resp = await cafeApi.get<Producto>(`/productos/${id}`);
    return resp.data;
    };

  // ---- Favoritos ----
  const loadFavorito = async (user: string, product: string): Promise<Favoritos> => {
    const resp = await cafeApi.get<Favoritos>(`/favoritos/${user}/${product}`);
    return resp.data;
  };

  const actualizarFavorito = async (id: string, favorite: boolean) => {
    const resp = await cafeApi.put<Favoritos>(`/favoritos/${id}`, {
      favorito: favorite,
    });
    return resp.data;
  };

  const crearFavorito = async (user: string, product: string): Promise<Favoritos> => {
    const resp = await cafeApi.post<Favoritos>("/favoritos", {
      usuario: user,
      producto: product,
    });
    return resp.data;
  };

  const obtenerFavoritos = async (userId: string) => {
    const resp = await cafeApi.get<FavoritosResponse>(`/favoritos/${userId}`);
    const idsFavoritos = resp.data.favoritos.map((f) => f.producto);
    setFavoritos(idsFavoritos);
  };

  const uploadImage = async (data: any, id: string) => {
    // no-op
  };

  const loadCategoriaById = async (id: string): Promise<Categoria> => {
    const resp = await cafeApi.get<Categoria>(`/categorias/${id}`);
    return resp.data;
  };

  const mostrarIcon = (id: string) => {
    if (id === "mostrar_ingreso") {
      setShowIcon("mostrar_ingreso");
    } else if (id === "mostrar_bolsa") {
      setShowIcon("mostrar_bolsa");
    } else if (id === "mostrar_reserva") {
      setShowIcon("mostrar_reserva");
    } else {
      setShowIcon("ocultar");
    }
    return showIcon;
  };

  const calcCompras = (id: number) => {
    setCantCompras(id);
  };

  const handleMostrarSeleccion = (state: CheckboxStates, cant: CantidadState, tipo: selectedProducts[]) => {
    const resultado = Object.entries(state)
      .map(([id, checked]) => {
        if (checked) {
          const cantidad = cant[id] || 1;
          const producto = products.find((p) => p._id === id);
          if (producto) {
            const existingProduct = tipo.find((p) => p.codigo === id);
            let radioValues: { [key: number]: string } = {};
            let guarnicion: { [key: number]: string } = {};
            let salsa: { [key: number]: string } = {};

            if (existingProduct) {
              radioValues = {};
              guarnicion = {};
              salsa = {};
              for (let i = 0; i < cantidad; i++) {
                radioValues[i] =
                  existingProduct.radioValues && existingProduct.radioValues[i]
                    ? existingProduct.radioValues[i]
                    : "3/4";
                guarnicion[i] =
                  existingProduct.guarnicion && existingProduct.guarnicion[i]
                    ? existingProduct.guarnicion[i]
                    : "Ensalada";
                salsa[i] =
                  existingProduct.salsa && existingProduct.salsa[i]
                    ? existingProduct.salsa[i]
                    : "Fileto";
              }
            }

            const subtotal = cantidad * producto.precio;
            return { ...producto, cantidad, radioValues, guarnicion, salsa, subtotal };
          }
        }
        return null;
      })
      .filter(Boolean) as Producto[];
    setResult([...resultado]);
    return result;
  };

  // ---- Modales / Reservas ----
   const mostrarModal = (id: string) => {
    switch (id) {
      case "mostrar":
        setModalVisible(true);
        setModalVisible2(false);
        break;
      case "mostrar2":
        if (!suppressAutoOpenRef.current) {
          setModalVisible2(true);
          setModalVisible(false);
        }
        break;
      case "mostrarR":
        setVisibleR(true);
        break;
      case "ocultar_modal":
        // si el cierre es “manual”, usa closeModalSafely desde el componente
        setModalVisible(false);
        setModalVisible2(false);
        break;
      case "ocultarR":
        setVisibleR(false);
        break;
      default:
        break;
    }
  };

  const mostrarSearch = (id: string) => setSearchText(id);
  const mostrarVBuscar = (id: boolean) => setVBuscar(!id);

  // 🔒 Regla centralizada para abrir/cerrar según estado actual
  const ensureModalRule = () => {
    const hayPendiente = reservas.some((r) => r.resest === "Pendiente");

    // Si está suprimido, no auto-abrir/cerrar nada
    if (suppressAutoOpenRef.current) return;

    if (reservas.length === 0) {
      // Sin reservas -> abrir selector (si no está ya)
      if (!modalVisible2) mostrarModal("mostrar2");
      return;
    }

    if (hayPendiente) {
      // Hay pendiente -> no mostrar selector
      if (modalVisible2) mostrarModal("ocultar_modal");
      return;
    }

    // Todas completadas -> abrir selector si está cerrado
    if (!modalVisible2 && !modalVisible) {
      mostrarModal("mostrar2");
    }
  };

  const addReserva = async (cantidad: number, fecha: Date, tipo: string): Promise<Reservas> => {
    const resp = await cafeApi.post<Reservas>("/reservas", {
      cantidad,
      fecha,
      tipo,
    });
    setReservas([...reservas, resp.data]);
    return resp.data;
  };

 const loadReservas = async () => {
  try {
    console.log("🔄 Cargando reservas...");

    const resp = await cafeApi.get<ReservasResponse>("/reservas?limite=500");
    const reservasFiltradas = resp.data.reservas.filter(
      (r) => r.usuario._id === user?.uid
    );

    setCantReservas(reservasFiltradas.length);
    setReservas(reservasFiltradas);

    const reservaPendiente = reservasFiltradas.find((r) => r.resest === "Pendiente");
    const ultimaReserva = reservasFiltradas[reservasFiltradas.length - 1];
    const hayPendiente = !!reservaPendiente;
    setHasPendiente(hayPendiente);

    // 🔐 Marca como cargado
    setReservasListas(true);

    // ======================================================
    // 0️⃣ SI YA EXISTE UNA RESERVA SELECCIONADA → MANTENER
    // ======================================================
    if (idReserva) {
      const r = reservasFiltradas.find((res) => res._id === idReserva);
      if (r) {
        const fechaFormateada = new Date(r.fecha).toLocaleString("es-BO", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        menuReserva(r._id, r.cantidad, fechaFormateada, r.tipo || "Resto");
      }
      console.log("🔒 Manteniendo reserva seleccionada:", idReserva);
      return;
    }

    // ======================================================
    // 1️⃣ SI HAY PENDIENTE → USAR ESA SIEMPRE
    // ======================================================
    if (reservaPendiente) {
      console.log("🟡 Usando reserva pendiente (no mostrar modal)");

      // 🔥 Bloquear auto-apertura del modal y cerrar si está abierto
      suppressAutoOpenRef.current = true;
      closeModalSafely();

      const fechaFormateada = new Date(reservaPendiente.fecha).toLocaleString(
        "es-BO",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      menuReserva(
        reservaPendiente._id,
        reservaPendiente.cantidad,
        fechaFormateada,
        reservaPendiente.tipo || "Resto"
      );

      return;
    }

    // ======================================================
    // 2️⃣ NO HAY PENDIENTE → REVISAR ÚLTIMA RESERVA
    // ======================================================
    if (ultimaReserva) {
      const fechaFormateada = new Date(ultimaReserva.fecha).toLocaleString(
        "es-BO",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      menuReserva(
        ultimaReserva._id,
        ultimaReserva.cantidad,
        fechaFormateada,
        ultimaReserva.tipo || "Resto"
      );

     if (ultimaReserva.resest === "Pagado") {
  console.log("🔴 Última reserva pagada → mostrar modal para elegir nueva");
  // Limpia selección anterior
  menuReserva("", 0, "Escoger Reserva", "Resto");

  // Mostrar modal principal
  if (!suppressAutoOpenRef.current) {
    mostrarModal("mostrar2");
  }

  return; // ✔️ salir y no seguir procesando
} else {
  console.log("🆕 Usando última reserva no pagada");
}

      return;
    }

    // ======================================================
    // 3️⃣ NO EXISTE NINGUNA RESERVA → ABRIR MODAL
    // ======================================================
    console.log("📭 No hay reservas → abrir modal");
    menuReserva("", 0, "Escoger Reserva", "Resto");

    if (!suppressAutoOpenRef.current) {
      mostrarModal("mostrar2");
    }

  } catch (error) {
    console.error("❌ Error al cargar reservas:", error);
  }
};

  const deleteReserva = async (id: string) => {
    try {
      await cafeApi.delete<ReservasResponse>(`/reservas/${id}`);
      loadReservas();
    } catch (error) {
      console.error("Error al eliminar la reserva:");
      throw error;
    }
  };

  const menuReserva = (id: string, cantidad: number, fecha: string, tipo: string) => {
    setIdReserva(id);
    setCantidadReserva(cantidad);
    setFechaReserva(fecha);
    setTipoReserva(tipo);
 
  };

  const addMenuReserva = async (reserva: string, productos: Producto1[]): Promise<MenuReservas> => {
    setVSnack(false);
    const resp = await cafeApi.post<MenuReservas>("/menureservas", {
      reserva,
      productos,
    });
    setMenuReservas([...menureservas, resp.data]);
    setVSnack(true);
    return resp.data;
  };

  const updateMenuReserva = async (reserva: string, productos: Producto1[]) => {
    setVSnack(false);
    await cafeApi.put<MenuReservas>(`/menureservas/${reserva}`, {
      productos,
      fecha_creacion: Date.now,
    });
    setVSnack(true);
  };

  const loadMReservas = async () => {
    const resp = await cafeApi.get<MenuResponse>("/menureservas");
    const mreservasFiltradas = resp.data.menureservas.filter((reserva) => {
  const userIdBackend =
    typeof reserva.usuario === "string"
      ? reserva.usuario
      : reserva.usuario?._id;

  return userIdBackend === user?.uid;
});
    setCantMReservas(mreservasFiltradas.length);
    setMReservas([...mreservasFiltradas]);
  };

  const actualizarResult = (arreglomr: Producto[]) => {
    setResult([...arreglomr]);
    return result;
  };

  const grabarMenuReserva = async () => {
    const arregloMenuReserva: Producto1[] = result.map((producto) => ({
      producto,
      cantidad: producto.cantidad ?? 1,
      termino: Object.entries(producto.radioValues || {}).map(([index, value]) => ({
        index: parseInt(index),
        value,
      })),
      guarnicion: Object.entries(producto.guarnicion || {}).map(([index, value]) => ({
        index: parseInt(index),
        value,
      })),
      salsa: Object.entries(producto.salsa || {}).map(([index, value]) => ({
        index: parseInt(index),
        value,
      })),
    }));

    const reservaExiste = mreservas.find((reserva) => reserva.reserva === idReserva);
    try {
      if (idReserva !== "") {
        if (reservaExiste) {
          await updateMenuReserva(reservaExiste._id, arregloMenuReserva);
        } else {
          await addMenuReserva(idReserva, arregloMenuReserva);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const generarQRPago = async (monto: number): Promise<{ qrId: number; qrImg: string }> => {
    try {
      const resp = await cafeApi.get<{ qrId: number; qrImg: string }>(`/pagosqr/qr/${monto}`);
      return resp.data;
    } catch (error) {
      console.error("Error generando QR:", error);
      throw new Error("Error generando QR");
    }
  };

  const verificarEstadoQRPago = async (qrId: number): Promise<"pagado" | "pendiente"> => {
    try {
      const resp = await cafeApi.post<{ status: string }>(`/pagosqr/qr/status`, { qrId });
      return resp.data.status === "pagado" ? "pagado" : "pendiente";
    } catch (error) {
      console.error("Error verificando estado del QR:", error);
      throw new Error("Error verificando QR");
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        loadProductById,
        uploadImage,
        loadCategoriaById,

        mostrarIcon,
        showIcon,
        calcCompras,
        cantCompras,
        handleMostrarSeleccion,
        result,

        addReserva,
        mostrarModal,
        modalVisible,
        modalVisible2,
        visibleR,

        loadReservas,
        reservas,
        deleteReserva,
        cantReservas,
        menuReserva,
        idReserva,
        cantidadReserva,
        fechaReserva,
        tipoReserva,

        addMenuReserva,
        updateMenuReserva,
        menureservas,
        loadMReservas,
        mreservas,

        actualizarResult,
        grabarMenuReserva,

        vSnack,
        searchText,
        mostrarSearch,
        vBuscar,
        mostrarVBuscar,

        loadFavorito,
        crearFavorito,
        actualizarFavorito,
        obtenerFavoritos,
        favoritos,

        generarQRPago,
        verificarEstadoQRPago,

        hasPendiente,
        ensureModalRule,
        closeModalSafely,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};