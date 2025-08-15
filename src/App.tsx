
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
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Sidebar from './components/Sidebar';
import LoginScreen from './pages/LoginScreen';
import Menu from './pages/Menu';
import Paquetes from './pages/Paquetes';
import { AuthProvider, AuthContext } from './context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  return user ? React.createElement(React.Fragment, null, children) : React.createElement(Navigate, { to: '/LoginScreen', replace: true });
}

function AppContent() {
  const location = useLocation();
  const { status } = useContext(AuthContext);
  const showSidebar = location.pathname !== '/LoginScreen';
  const isLogin = location.pathname === '/LoginScreen';

  // Spinner mientras valida token
  if (status === 'checking') {
    return (
      React.createElement(
        Box,
        {
          sx: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100%',
            bgcolor: '#f7f7f8',
            flexDirection: 'column',
          },
        },
        React.createElement(CircularProgress, { size: 60, thickness: 4 }),
        React.createElement('p', { style: { marginTop: 16, fontSize: 16, color: '#555' } }, 'Cargando...')
      )
    );
  }

  // Contenedor centrado para login y páginas
  const contentBoxProps = {
    sx: {
      flexGrow: 1,
      ml: showSidebar ? { sm: '260px' } : 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: isLogin ? 0 : 3,
      width: '100%',
      minHeight: '100vh',
      flexDirection: 'column',
    },
  };

  return (
    React.createElement(
      Box,
      { sx: { display: 'flex', minHeight: '100vh' } },
      showSidebar && React.createElement(Sidebar),
      React.createElement(
        Box,
        contentBoxProps,
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/LoginScreen', element: React.createElement(LoginScreen) }),
          React.createElement(Route, { path: '/Menu', element: React.createElement(PrivateRoute, null, React.createElement(Menu)) }),
          React.createElement(Route, { path: '/Paquetes', element: React.createElement(PrivateRoute, null, React.createElement(Paquetes)) }),
          React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/LoginScreen', replace: true }) })
        )
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

export default App;

