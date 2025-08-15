
/*import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './pages/LoginScreen';
import Menu from './pages/Menu';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Componente para proteger rutas
import { ReactNode, useContext } from 'react';

interface RequireAuthProps {
  children: ReactNode;
}

function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useContext(AuthContext);
  if (status !== 'authenticated') {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route
            path="/menu"
            element={
              <RequireAuth>
                <Menu />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;*/

import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginScreen from './pages/LoginScreen';
import Menu from './pages/Menu';
import { AuthProvider } from './context/AuthContext';
import { Box } from '@mui/material';

function AppContent() {
  const location = useLocation();
  const showSidebar = location.pathname !== '/LoginScreen'; // No mostrar en login

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: showSidebar ? { sm: '260px' } : 0, // Desplaza contenido cuando hay Sidebar
        }}
      >
        <Routes>
          <Route path="/LoginScreen" element={<LoginScreen />} />
          <Route path="/Menu" element={<Menu />} />
          {/* Otras rutas */}
        </Routes>
      </Box>
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
