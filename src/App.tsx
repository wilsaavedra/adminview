
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Fade } from '@mui/material';
import Sidebar from './components/Sidebar';
import LoginScreen from './pages/LoginScreen';
import Menu from './pages/Menu';
import Paquetes from './pages/Paquetes';
import Reservar from './pages/Reservar';
import Reservas from './pages/Reservas';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, AuthContext } from './context/AuthContext';
import MenuReservas from './pages/MenuReservas';
import MenuReservasDetalle from './pages/MenuReservasDetalle';

type Role = 'ADMIN_ROLE' | 'USER_ROLE' | 'COCINERO_ROLE';

function PrivateRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/LoginScreen" replace />;

  const userRole = user.rol as Role;

  // 🔐 ADMIN_ROLE entra a todo (aunque no esté declarado)
  if (roles && !roles.includes(userRole) && userRole !== 'ADMIN_ROLE') {
    return <Navigate to="/Menu" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const { status } = useContext(AuthContext);

  const showSidebar = location.pathname !== '/LoginScreen';
  const isLogin = location.pathname === '/LoginScreen';

  if (status === 'checking') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: { xs: '100svh', md: '100vh' },
          width: '100%',
          bgcolor: '#f7f7f8',
          flexDirection: 'column',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <p style={{ marginTop: 16, fontSize: 16, color: '#555' }}>Cargando...</p>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: { xs: '100svh', md: '100vh' } }}>
      {showSidebar && <Sidebar />}

      <Fade in timeout={400}>
 <Box
  sx={{
    flexGrow: 1,
    ml: showSidebar ? { md: '260px' } : 0,

    // 🔥 Permite que el contenido crezca horizontalmente sin corte
    overflowX: "auto",

    // 🔥 No limitar ancho para tablas
    width: "100%",

    // 🔥 Sin centrado vertical forzado
    display: "block",

    // 🔥 IMPORTANTE: en móvil cero padding para no recortar scroll
    p: { xs: 0, sm: 0, md: 2 },

    // 🔥 Garantiza que el scroll sea del contenedor padre, no del hijo
    position: "relative",
  }}
>
          <Routes>
            <Route
              path="/LoginScreen"
              element={
                status === 'authenticated' ? (
                  <Navigate to="/Menu" replace />
                ) : (
                  <LoginScreen />
                )
              }
            />

            <Route
              path="/"
              element={
                status === 'authenticated' ? (
                  <Navigate to="/Menu" replace />
                ) : (
                  <Navigate to="/LoginScreen" replace />
                )
              }
            />

            {/* ACCESO GENERAL */}
            <Route
              path="/Menu"
              element={
                <PrivateRoute>
                  <Menu />
                </PrivateRoute>
              }
            />

            <Route
              path="/Reservar"
              element={
                <PrivateRoute>
                  <Reservar />
                </PrivateRoute>
              }
            />

            <Route
              path="/Reservas"
              element={
                <PrivateRoute>
                  <Reservas />
                </PrivateRoute>
              }
            />

            {/* SOLO ADMIN */}
            <Route
              path="/MenuReservas"
              element={
                <PrivateRoute roles={['ADMIN_ROLE']}>
                  <MenuReservas />
                </PrivateRoute>
              }
            />
<Route
  path="/MenuReservasDetalle/:id"
  element={
    <PrivateRoute roles={["ADMIN_ROLE"]}>
      <MenuReservasDetalle />
    </PrivateRoute>
  }
/>
            <Route
              path="*"
              element={
                status === 'authenticated' ? (
                  <Navigate to="/Menu" replace />
                ) : (
                  <Navigate to="/LoginScreen" replace />
                )
              }
            />
          </Routes>
        </Box>
      </Fade>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AuthProvider>
  );
}

export default App;