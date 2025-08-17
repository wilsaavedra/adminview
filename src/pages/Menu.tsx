import React from 'react';
import { Box, Typography } from '@mui/material';
import Frontis from '../assets/frontis.jpg'; // Asegúrate de la ruta correcta

export default function Menu() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 2,
        backgroundColor: '#ffffff',
        textAlign: 'center',
      }}
    >
      {/* Imagen centrada y responsiva */}
      <Box
        component="img"
        src={Frontis}
        alt="Frontis"
        sx={{
          width: { xs: '80%', sm: '60%', md: '40%' }, // cambia tamaño según pantalla
          maxWidth: 800,
          height: 'auto',
          mb: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      />

      {/* Texto principal */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 500,
          mb: 1,
          fontSize: { xs: 14, sm: 16, md: 18 }, // responsivo
        }}
      >
        Bienvenido al sistema de Administración View
      </Typography>

      {/* Texto secundario */}
      <Typography
        sx={{
          fontSize: { xs: 10, sm: 12, md: 14 },
          color: '#555',
          maxWidth: 400,
        }}
      >
        Aquí puedes gestionar productos, reservas y estadísticas.
      </Typography>
    </Box>
  );
}
