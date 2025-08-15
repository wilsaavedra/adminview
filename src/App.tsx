
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


import React, { useContext } from 'react';
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

export default App;

