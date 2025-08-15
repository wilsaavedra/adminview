import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname === '/LoginScreen';

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        bgcolor: '#ffffff',
      }}
    >
      {/* Sidebar solo si no es login */}
      {!hideSidebar && (
        <Box
          sx={{
            width: { xs: 0, sm: 260 },
            flexShrink: 0,
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* Área de contenido */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: hideSidebar ? 0 : '260px' },
          bgcolor: '#ffffff',
          minHeight: '100vh',
          transition: 'margin 0.3s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
