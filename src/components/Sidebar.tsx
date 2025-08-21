// src/components/Sidebar.tsx
import React, { useState, useContext, ReactNode } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from '../assets/View3.png';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ListAltIcon from '@mui/icons-material/ListAlt';

const menuItems = [
  { text: 'Inicio', icon: <HomeOutlinedIcon fontSize="small" />, path: '/Menu' },
  { text: 'Reservar', icon: <EventAvailableIcon fontSize="small" />, path: '/Reservar' },
  { text: 'Mis Reservas', icon: <ListAltIcon fontSize="small" />, path: '/Reservas' },
  { text: 'Paquetes', icon: <LocalOfferOutlinedIcon fontSize="small" />, path: '/Paquetes' },
];

interface SidebarProps {
  children?: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const { logOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawerWidth = collapsed ? 70 : 260;

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        bgcolor: '#f7f7f8',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        pt: 1,
        transition: 'width 0.3s ease',
      }}
    >
      <Box sx={{ flex: 1 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <img
            src={Logo}
            alt="Logo"
            onClick={() => collapsed && setCollapsed(false)}
            style={{
              width: collapsed ? 40 : 100,
              height: 'auto',
              transition: 'width 0.3s ease',
              cursor: collapsed ? 'pointer' : 'default',
            }}
          />
        </Box>

        {/* Menú principal */}
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <Tooltip
              key={item.text}
              title={collapsed ? item.text : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  px: collapsed ? 1 : 2,
                  py: 0.8,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                  },
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: '#000',
                    minWidth: collapsed ? 'auto' : 32,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Box>

      {/* Logout + botón colapso */}
      <Box>
        <List sx={{ p: 0 }}>
          <Tooltip title={collapsed ? 'Cerrar Sesión' : ''} placement="right" arrow>
            <ListItemButton
              onClick={() => {
                logOut();
                navigate('/LoginScreen');
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1,
                px: collapsed ? 1 : 2,
                py: 0.8,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
              }}
            >
              <ListItemIcon
                sx={{
                  color: '#000',
                  minWidth: collapsed ? 'auto' : 32,
                  justifyContent: 'center',
                }}
              >
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Cerrar Sesión"
                  primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </List>

        {/* Botón colapsar/expandir */}
        <Box sx={{ textAlign: 'center', pb: 1, display: { xs: 'none', md: 'block' } }}>
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small">
            {collapsed ? <KeyboardDoubleArrowRightIcon /> : <KeyboardDoubleArrowLeftIcon />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Botón hamburguesa (móvil/tablet) */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ ml: 1, mt: 1, display: { md: 'none' } }}
      >
        <MenuIcon fontSize="small" />
      </IconButton>

      {/* Drawer en móvil/tablet */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            bgcolor: '#f7f7f8',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer en escritorio */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: '#f7f7f8',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* CONTENIDO PRINCIPAL (ya no tiene margin-left manual) */}
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        {children}
      </Box>
    </Box>
  );
}
