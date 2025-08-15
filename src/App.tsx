
/*import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginScreen from './pages/LoginScreen';
import Menu from './pages/Menu';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Box } from '@mui/material';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  return user ? React.createElement(React.Fragment, null, children) : React.createElement(Navigate, { to: '/LoginScreen', replace: true });
}

function AppContent() {
  const location = useLocation();
  const showSidebar = location.pathname !== '/LoginScreen';

  return React.createElement(
    Box,
    { sx: { display: 'flex', minHeight: '100vh' } },
    showSidebar && React.createElement(Sidebar),
    React.createElement(
      Box,
      {
        sx: {
          flexGrow: 1,
          p: 3,
          ml: showSidebar ? { sm: '260px' } : 0,
        },
      },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/LoginScreen', element: React.createElement(LoginScreen) }),
        React.createElement(Route, {
          path: '/Menu',
          element: React.createElement(PrivateRoute, null, React.createElement(Menu)),
        }),
        React.createElement(Route, {
          path: '*',
          element: React.createElement(Navigate, { to: '/LoginScreen', replace: true }),
        })
      )
    )
  );
}

function App() {
  return React.createElement(
    AuthProvider,
    null,
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(AppContent)
    )
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

  // 🔹 Mientras está validando sesión, no renderizamos rutas
  if (status === 'checking') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && <Sidebar />}
      <Fade in timeout={400}>
        <Box
          sx={{
            flexGrow: 1,
            ml: showSidebar ? { sm: '260px' } : 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: isLogin ? 0 : 3,
            width: '100%',
            minHeight: '100vh',
            flexDirection: 'column',
          }}
        >
          <Routes>
            <Route path="/LoginScreen" element={<LoginScreen />} />
            <Route
              path="/Menu"
              element={
                <PrivateRoute>
                  <Menu />
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
            <Route path="*" element={<Navigate to="/LoginScreen" replace />} />
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
    </AuthProvider>
  );
}

export default App;
