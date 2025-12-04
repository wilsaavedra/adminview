/*import React, { useContext } from 'react';
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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  return user ? <>{children}</> : <Navigate to="/LoginScreen" replace />;
}

function AppContent() {
  const location = useLocation();
  const { status } = useContext(AuthContext);

  const showSidebar = location.pathname !== '/LoginScreen';
  const isLogin = location.pathname === '/LoginScreen';

  // Mientras se valida la sesión, solo mostramos el spinner (no rutas).
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
            ml: showSidebar ? { sm: '260px' } : 0, // deja espacio para el Sidebar en escritorio
            display: 'flex',
            justifyContent: 'flex-start',//'center',
            alignItems: 'center',
            p: isLogin ? 0 : 3,
            width: '100%',
            minHeight: 'inherit', // hereda 100svh/100vh para centrar vertical
            flexDirection: 'column',
          }}
        >
          <Routes>
       
            <Route
              path="/LoginScreen"
              element={
                status === 'authenticated' ? <Navigate to="/Menu" replace /> : <LoginScreen />
              }
            />

            <Route
              path="/"
              element={
                status === 'authenticated'
                  ? <Navigate to="/Menu" replace />
                  : <Navigate to="/LoginScreen" replace />
              }
            />

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
            <Route
              path="/Paquetes"
              element={
                <PrivateRoute>
                  <Paquetes />
                </PrivateRoute>
              }
            />

      
            <Route
              path="*"
              element={
                status === 'authenticated'
                  ? <Navigate to="/Menu" replace />
                  : <Navigate to="/LoginScreen" replace />
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
        theme="colored" // o "light" si prefieres
      />
    </AuthProvider>
  );
}

export default App;*/

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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  return user ? <>{children}</> : <Navigate to="/LoginScreen" replace />;
}

function AppContent() {
  const location = useLocation();
  const { status } = useContext(AuthContext);

  const showSidebar = location.pathname !== '/LoginScreen';
  const isLogin = location.pathname === '/LoginScreen';

  // Mientras se valida la sesión, solo mostramos el spinner
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
            ml: showSidebar ? { md: '260px' } : 0, // fijo solo en escritorio (>=900px)
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            p: isLogin ? 0 : 3,
            width: '100%',
            minHeight: 'inherit',
            flexDirection: 'column',
          }}
        >
          <Routes>
            {/* Login */}
            <Route
              path="/LoginScreen"
              element={
                status === 'authenticated' ? <Navigate to="/Menu" replace /> : <LoginScreen />
              }
            />

            {/* Home */}
            <Route
              path="/"
              element={
                status === 'authenticated'
                  ? <Navigate to="/Menu" replace />
                  : <Navigate to="/LoginScreen" replace />
              }
            />

            {/* Rutas privadas */}
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
            <Route
              path="/Paquetes"
              element={
                <PrivateRoute>
                  <Paquetes />
                </PrivateRoute>
              }
            />

            {/* Catch all */}
            <Route
              path="*"
              element={
                status === 'authenticated'
                  ? <Navigate to="/Menu" replace />
                  : <Navigate to="/LoginScreen" replace />
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

