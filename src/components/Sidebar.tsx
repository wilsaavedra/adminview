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
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'; // NUEVO ICONO
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from '../assets/View3.png';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ListAltIcon from '@mui/icons-material/ListAlt';

type Role = 'ADMIN_ROLE' | 'USER_ROLE' | 'COCINERO_ROLE';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles?: Role[];
}

// 🔐 CONFIG MENÚ — ADMIN VE TODO AUTOMÁTICAMENTE
const menuItems: MenuItem[] = [
  {
    text: 'Inicio',
    icon: <HomeOutlinedIcon fontSize="small" />,
    path: '/Menu',
  },
  {
    text: 'Reservar',
    icon: <EventAvailableIcon fontSize="small" />,
    path: '/Reservar',
  },
  {
    text: 'Mis Reservas',
    icon: <ListAltIcon fontSize="small" />,
    path: '/Reservas',
  },
  {
    text: 'Menú Reservas',
    icon: <PlaylistAddCheckIcon fontSize="small" />, // ÍCONO NUEVO
    path: '/MenuReservas',
    roles: ['ADMIN_ROLE'], // solo admin pero admin entra a todo igualmente
  },
];

interface SidebarProps {
  children?: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const { logOut, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const drawerWidth = collapsed ? 70 : 260;

  const userRole: Role = (user?.rol as Role) || 'USER_ROLE';

  // 🔥 ADMIN_ROLE entra a TODO incluso si no está declarado en roles
  const visibleMenuItems = menuItems.filter(
    (item) =>
      !item.roles || item.roles.includes(userRole) || userRole === 'ADMIN_ROLE'
  );

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

        <List sx={{ p: 0 }}>
          {visibleMenuItems.map((item) => (
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

        <Box sx={{ textAlign: 'center', pb: 1, display: { xs: 'none', md: 'block' } }}>
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small">
            {collapsed ? <KeyboardDoubleArrowRightIcon /> : <KeyboardDoubleArrowLeftIcon />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box sx={{ position: 'fixed', top: 8, left: 8, zIndex: 1300, display: { md: 'none' } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          size="small"
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>

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

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            bgcolor: '#f7f7f8',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          transition: 'width 0.3s ease',
          width: { md: `calc(100% - 260px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}