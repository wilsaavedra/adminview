// src/components/CorporateMenu.tsx
/*import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { Home, Assignment, AccountCircle, ExitToApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
}

export default function CorporateMenu() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('');

  const menuItems: MenuItem[] = [
    { label: 'Inicio', icon: <Home />, path: '/menu' },
    { label: 'Paquetes', icon: <Assignment />, path: '/paquetes' },
    { label: 'Perfil', icon: <AccountCircle />, path: '/perfil' },
    {
      label: 'Cerrar Sesión',
      icon: <ExitToApp />,
      action: () => {
        console.log('Cerrar sesión');
        // logOut();
        navigate('/login');
      },
    },
  ];

  const handleClick = (item: MenuItem) => {
    setSelected(item.label);
    if (item.path) navigate(item.path);
    if (item.action) item.action();
  };

  return (
    <Box
      sx={{
        width: 220,
        minHeight: '100vh',
        bgcolor: '#f8f9fa', // color neutro corporativo
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
    
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
        MiEmpresa
      </Typography>

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.label}>
            <ListItemButton
              selected={selected === item.label}
              onClick={() => handleClick(item)}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.08)' },
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              }}
            >
              <ListItemIcon sx={{ color: '#333' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected === item.label ? 600 : 400 }}
              />
            </ListItemButton>
            <Divider />
          </React.Fragment>
        ))}
      </List>

     
      <Box sx={{ mt: 'auto', textAlign: 'center', py: 2, color: '#888', fontSize: '0.85rem' }}>
        © 2025 MiEmpresa
      </Box>
    </Box>
  );
}*/

import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Menu() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido al Panel
      </Typography>
      <Typography>
        Aquí puedes colocar tu contenido profesional, productos, estadísticas, o lo que necesites.
      </Typography>
    </Box>
  );
}
