import React, { useEffect, useRef, useState,useContext } from 'react';
import axios from 'axios';
import '../styles/Menu.css';
import ViewLogo from '../assets/View7.png';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Producto {
  _id: string;
  nombre: string;
  precio: number;
  img?: string;
  categoria?: {
    nombre: string;
  };
}

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

const getProductos = () => API.get('/productos');

const CATEGORIAS_COMIDA = [
  'ENTRADAS',
  'CARNES A LA PARRILLA',
  'ENSALADAS',
  'GUARNICIONES EXTRAS',
  'PASTAS',
  'SALSAS EXTRAS',
  'OTROS',
  'POSTRES',
];

const CATEGORIAS_BEBIDA = ['GASEOSAS Y JUGOS', 'CAFETERIA', 'CERVEZAS', 'TRAGOS'];

const CATEGORIAS_VINOS = [
  'VINOS TINTOS',
  'VINOS BLANCOS Y ROSADOS',
  'CHAMPAGNE Y ESPUMANTES',
];

// Orden maestro para todas las categorías, usado para mostrar siempre en este orden
const ordenCategoriasMaestro: string[] = [
  'ENTRADAS',
  'CARNES A LA PARRILLA',
  'ENSALADAS',
  'GUARNICIONES EXTRAS',
  'PASTAS',
  'SALSAS EXTRAS',
  'OTROS',
  'POSTRES',
  'GASEOSAS Y JUGOS',
  'CAFETERIA',
  'CERVEZAS',
  'TRAGOS',
  'VINOS TINTOS',
  'VINOS BLANCOS Y ROSADOS',
  'CHAMPAGNE Y ESPUMANTES',
  'PAQUETES',
];

type Filtro = 'COMIDA' | 'BEBIDA' | 'VINOS' | 'PAQUETES' | 'TODOS' | null;


interface ReservaDatos {
    nombre: string;
    telefono: string;
    fecha: string;
    hora: string;
    personas: number;
  }
  
  const minFecha = new Date().toISOString().split('T')[0];
  const maxFecha = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  })();
  
  const generarOpcionesHora = (): string[] => {
    const opciones: string[] = [];
    const pad = (n: number) => n.toString().padStart(2, '0');
  
    for (let h = 12; h <= 15; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 15 && m > 0) continue;
        opciones.push(`${pad(h)}:${pad(m)}`);
      }
    }
    for (let h = 18; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 18 && m < 30) continue;
        if (h === 22 && m > 30) continue;
        opciones.push(`${pad(h)}:${pad(m)}`);
      }
    }
    return opciones;
  };
  
  const validarHora = (horaStr: string) => {
    if (!horaStr) return false;
    const [hh, mm] = horaStr.split(':').map(Number);
    const minutosTotales = hh * 60 + mm;
    const rango1Inicio = 12 * 60;
    const rango1Fin = 15 * 60;
    const rango2Inicio = 18 * 60 + 30;
    const rango2Fin = 22 * 60 + 30;
    return (
      (minutosTotales >= rango1Inicio && minutosTotales <= rango1Fin) ||
      (minutosTotales >= rango2Inicio && minutosTotales <= rango2Fin)
    );
  };



const Menu = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<Filtro>('COMIDA');
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [errorHora, setErrorHora] = useState<string | null>(null);

  const { signIn, logOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const menuRef = useRef<HTMLDivElement>(null);

  // Estado para formulario de reserva
  const [reservaDatos, setReservaDatos] = useState({
    nombre: '',
    telefono: '',
    fecha: '',
    hora: '',
    personas: 1,
  });

  
  

  useEffect(() => {
    getProductos()
      .then((res) => setProductos(res.data.productos))
      .catch((err) => console.error('Error al obtener productos:', err));
  }, []);

  // Cerrar menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        menuAbierto &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuAbierto]);

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mostrarHorarios) setMostrarHorarios(false);
        if (mostrarReserva) setMostrarReserva(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [mostrarHorarios, mostrarReserva]);

  const productosPorCategoria = productos.reduce(
    (acc: { [key: string]: Producto[] }, producto) => {
      const categoria = producto.categoria?.nombre || 'Sin Categoría';
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(producto);
      return acc;
    },
    {}
  );

  const getCategoriasFiltradas = (): string[] => {
    let categorias: string[] = [];

    switch (filtroSeleccionado) {
      case 'COMIDA':
        categorias = CATEGORIAS_COMIDA;
        break;
      case 'BEBIDA':
        categorias = CATEGORIAS_BEBIDA;
        break;
      case 'VINOS':
        categorias = CATEGORIAS_VINOS;
        break;
      case 'PAQUETES':
        categorias = ['PAQUETES'];
        break;
      case 'TODOS':
        categorias = Object.keys(productosPorCategoria);
        break;
      default:
        categorias = [];
    }

    // Filtrar para que solo salgan categorías que estén en el orden maestro
    categorias = categorias.filter((cat) => ordenCategoriasMaestro.includes(cat));

    // Ordenar según el arreglo maestro
    categorias.sort(
      (a, b) =>
        ordenCategoriasMaestro.indexOf(a) - ordenCategoriasMaestro.indexOf(b)
    );

    return categorias;
  };

  const categoriasMostradas = getCategoriasFiltradas();

  const drawerVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 },
    exit: { x: '100%' },
  };

 
  const [loading, setLoading] = useState(false);

  const handleReservaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setReservaDatos((prev) => ({
      ...prev,
      [name]: name === 'personas' ? Number(value) : value,
    }));

    if (name === 'hora') {
      if (validarHora(value)) {
        setErrorHora(null);
      } else {
        setErrorHora('La hora debe estar entre 12:00-15:00 o 18:30-22:30');
      }
    }
  };

  const handleReservaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (errorHora) {
      alert('Corrige el error en la hora antes de enviar');
      return;
    }

    if (!reservaDatos.fecha || !reservaDatos.hora) {
      alert('Por favor, ingresa fecha y hora válidas');
      return;
    }


    // Crear objeto Date con fecha + hora
    const [hh, mm] = reservaDatos.hora.split(':').map(Number);
    const fechaHora = new Date(reservaDatos.fecha);
    fechaHora.setHours(hh, mm, 0, 0);

    // Validar rango fecha
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaMax = new Date(hoy);
    fechaMax.setMonth(fechaMax.getMonth() + 2);

    if (fechaHora < hoy) {
      alert('La fecha y hora no pueden ser en el pasado');
      return;
    }

    if (fechaHora > fechaMax) {
      alert('La fecha máxima permitida es 2 meses desde hoy');
      return;
    }

    try {
      setLoading(true);
      await API.post('/reservas', {
        nombre: reservaDatos.nombre,
        telefono: reservaDatos.telefono,
        fecha: fechaHora.toISOString(),
        cantidad: reservaDatos.personas,
       // usuario: '65483805b1889efceefa7a29' 
      });

      toast.success(`Reserva creada con éxito para ${reservaDatos.nombre}`);
      setMostrarReserva(false);

      setReservaDatos({
        nombre: '',
        telefono: '',
        fecha: '',
        hora: '',
        personas: 1,
      });
    } catch (error: any) {
        toast.error('Error al enviar la reserva');
      //alert('Error al enviar la reserva: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* BARRA SUPERIOR */}
      <div className="menu-header-bar">
        <img src={ViewLogo} alt="Logo" className="menu-logo" />
        {FiMenu({
          className: 'menu-icon',
          onClick: () => setMenuAbierto(true),
          color: 'white',
          size: 28,
          style: { cursor: 'pointer' },
        })}
      </div>

      {/* Drawer lateral y overlay */}
      <AnimatePresence>
        {menuAbierto && (
          <>
            {/* Overlay semitransparente */}
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuAbierto(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'black', zIndex: 998 }}
            />

            {/* Drawer lateral */}
            <motion.aside
              className="drawer"
              ref={menuRef}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={drawerVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '280px',
                height: '100vh',
                backgroundColor: '#fff',
                zIndex: 999,
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-3px 0 15px rgba(0,0,0,0.3)',
              }}
            >
              <button
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                style={{
                  fontSize: '2rem',
                  background: 'none',
                  border: 'none',
                  alignSelf: 'flex-end',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                }}
              >
                {FiX({ size: 24 })}
              </button>

              <nav>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li
                    style={{
                      padding: '1rem 0',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #ddd',
                      fontWeight: filtroSeleccionado === 'COMIDA' ? '700' : '400',
                      color: filtroSeleccionado === 'COMIDA' ? 'rgb(225,63,68)' : '#000',
                    }}
                    onClick={() => {
                      setFiltroSeleccionado('COMIDA');
                      setMenuAbierto(false);
                    }}
                  >
                    🍽️ Comida
                  </li>
                  <li
                    style={{
                      padding: '1rem 0',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #ddd',
                      fontWeight: filtroSeleccionado === 'BEBIDA' ? '700' : '400',
                      color: filtroSeleccionado === 'BEBIDA' ? 'rgb(225,63,68)' : '#000',
                    }}
                    onClick={() => {
                      setFiltroSeleccionado('BEBIDA');
                      setMenuAbierto(false);
                    }}
                  >
                    🥤 Bebida
                  </li>
                  <li
                    style={{
                      padding: '1rem 0',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #ddd',
                      fontWeight: filtroSeleccionado === 'VINOS' ? '700' : '400',
                      color: filtroSeleccionado === 'VINOS' ? 'rgb(225,63,68)' : '#000',
                    }}
                    onClick={() => {
                      setFiltroSeleccionado('VINOS');
                      setMenuAbierto(false);
                    }}
                  >
                    🍷 Vinos
                  </li>
                  <li
                    style={{
                      padding: '1rem 0',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #ddd',
                      fontWeight: filtroSeleccionado === 'PAQUETES' ? '700' : '400',
                      color: filtroSeleccionado === 'PAQUETES' ? 'rgb(225,63,68)' : '#000',
                    }}
                    onClick={() => {
                      logOut();
                      navigate('/LoginScreen');
                      //setFiltroSeleccionado('PAQUETES');
                      //setMenuAbierto(false);
                    }}
                  >
                    ⬅️ Cerrar Sesión
                  </li>

                  {/* Opción nueva para Reservar */}
                  <li
                    style={{
                      padding: '1rem 0',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #ddd',
                      fontWeight: mostrarReserva ? '700' : '400',
                      color: mostrarReserva ? '#007BFF' : '#000',
                    }}
                    onClick={() => {
                      setMenuAbierto(false);
                      setMostrarReserva(true);
                    }}
                  >
                    📅 Reservar
                  </li>

                  {/* Horarios */}
                  <li
                    style={{
                      padding: '1rem 0',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #ddd',
                      fontWeight: filtroSeleccionado === 'TODOS' ? '700' : '400',
                      color: filtroSeleccionado === 'TODOS' ? 'rgb(225,63,68)' : '#000',
                    }}
                    onClick={() => {
                      setMenuAbierto(false);
                      setMostrarHorarios(true);
                    }}
                  >
                    ⏰ Horarios
                  </li>
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal Horarios */}
      <AnimatePresence>
        {mostrarHorarios && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMostrarHorarios(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 998,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1rem',
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: '#ffffff',
                  zIndex: 999,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '420px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      color: '#111',
                    }}
                  >
                    Horarios de Atención
                  </h2>
                  <button
                    onClick={() => setMostrarHorarios(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Cerrar horarios"
                  >
                    {FiX({ size: 20 })}
                  </button>
                </div>

                <div style={{ marginTop: '0.25rem', color: '#444' }}>
                  <p style={{ margin: 0, fontSize: '1rem', color: '#555' }}>Lunes a Sábado</p>
                  <p
                    style={{
                      margin: '6px 0 10px',
                      fontWeight: 700,
                      color: '#000',
                    }}
                  >
                    12:00 a 15:00 | 18:30 a 22:30
                  </p>

                  <p style={{ margin: 0, fontSize: '1rem', color: '#555' }}>Domingos</p>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontWeight: 700,
                      color: '#000',
                    }}
                  >
                    12:00 a 16:00
                  </p>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => setMostrarHorarios(false)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgb(225,63,68)',//'#007BFF',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

   {/* Modal Reserva */}
   <AnimatePresence>
        {mostrarReserva && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMostrarReserva(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                zIndex: 999,
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '420px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    color: '#111',
                  }}
                >
                  Formulario de Reserva
                </h2>
                <button
                  onClick={() => setMostrarReserva(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="Cerrar reserva"
                >
                {FiX({ size: 20 })} 
                  
                </button>
              </div>

              <form onSubmit={handleReservaSubmit}>
                <label
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
                  htmlFor="nombre"
                >
                  Nombre:
                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={reservaDatos.nombre}
                    onChange={handleReservaChange}
                    required
                    placeholder="Tu nombre"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

                <label
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
                  htmlFor="telefono"
                >
                  Teléfono:
                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={reservaDatos.telefono}
                    onChange={handleReservaChange}
                    required
                    placeholder="Ej. 71234567"
                    min="10000000"      // mínimo número (8 dígitos)
                    step="1"            // evita decimales
                    pattern="^\+?\d{8,15}$"
                    title="El teléfono debe tener al menos 8 dígitos numericos"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

                <label
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
                  htmlFor="fecha"
                >
                  Fecha:
                  <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    value={reservaDatos.fecha}
                    onChange={handleReservaChange}
                    required
                    min={minFecha}
                    max={maxFecha}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

                <label
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
                  htmlFor="hora"
                >
                  Hora:
                  <select
                    id="hora"
                    name="hora"
                    value={reservaDatos.hora}
                    onChange={handleReservaChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: errorHora ? '2px solid red' : '1px solid #ccc',
                    }}
                  >
                    <option value="">Selecciona una hora</option>
                    {generarOpcionesHora().map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </select>
                </label>
                {errorHora && (
                  <p
                    style={{
                      color: 'red',
                      marginTop: '-0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    {errorHora}
                  </p>
                )}

                <label
                  style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}
                  htmlFor="personas"
                >
                  Personas:
                  <select
                    id="personas"
                    name="personas"
                    value={reservaDatos.personas}
                    onChange={handleReservaChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                    }}
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={!!errorHora || loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'rgb(225,63,68)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Enviando...' : 'Enviar Reserva'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* CONTENIDO PRINCIPAL */}
      <div className="menu-container" style={{ padding: '2rem' }}>
        <h1 className="menu-title">Menú</h1>

        {categoriasMostradas.map((categoria) => {
          const productosCategoria = productosPorCategoria[categoria];
          if (!productosCategoria) return null;

          return (
            <div key={categoria} className="categoria-section">
              <h2 className="categoria-titulo">{categoria}</h2>
              <div className="productos-grid">
                {productosCategoria.map((producto) => (
                  <div key={producto._id} className="producto-card">
                    {producto.img && (
                      <img
                        src={producto.img}
                        alt={producto.nombre}
                        className="producto-img"
                      />
                    )}
                    <h3 className="producto-nombre">{producto.nombre}</h3>
                    <p className="producto-categoria">Bs. {producto.precio}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};




export default Menu;
