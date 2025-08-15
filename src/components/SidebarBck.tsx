import React, { useState, useContext } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from '../assets/View3.png';

const menuItems = [
  { text: 'Inicio', icon: <HomeOutlinedIcon fontSize="small" />, path: '/Menu' },
  { text: 'Paquetes', icon: <LocalOfferOutlinedIcon fontSize="small" />, path: '/Paquetes' },
];

export default function Sidebar() {
  const { logOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawerContent = (
    <Box
      sx={{
        width: 260,
        height: '100%',
        bgcolor: '#f5f5f5', // Gris claro uniforme
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Contenido principal */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3 }}>
        {/* Logo */}
        <Box sx={{ mb: 4 }}>
          <img src={Logo} alt="Logo" style={{ width: 100, height: 'auto', display: 'block' }} />
        </Box>

        {/* Menú */}
        <List sx={{ width: '100%' }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1,
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                '&.Mui-selected': {
                  bgcolor: 'rgba(0,0,0,0.05)',
                },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
              }}
            >
              <ListItemIcon sx={{ color: '#000', minWidth: 32 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: 14,
                  textAlign: 'left',
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Logout */}
      <Box sx={{ mb: 3, width: '100%' }}>
        <List sx={{ p: 0 }}>
          <ListItemButton
            onClick={() => {
              logOut();
              navigate('/LoginScreen');
            }}
            sx={{
              borderRadius: 1,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
            }}
          >
            <ListItemIcon sx={{ color: '#000', minWidth: 32 }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar Sesión"
              primaryTypographyProps={{ fontWeight: 500, fontSize: 14, textAlign: 'left' }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Botón hamburguesa para móvil */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ ml: 1, mt: 1, display: { sm: 'none' } }}
      >
        <MenuIcon fontSize="small" />
      </IconButton>

      {/* Drawer temporal para móviles */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            bgcolor: '#f5f5f5',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer permanente para escritorio */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            bgcolor: '#f5f5f5',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
