import React from 'react';
import { Box, Typography } from '@mui/material';
import frontis from '../assets/frontis.jpg'; // Ajusta la ruta según tu estructura

export default function Menu() {
  return (
    <Box
      sx={{
        flexGrow: 1,
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
      {/* Imagen centrada */}
      <Box
        component="img"
        src={frontis}
        alt="Frontis"
        sx={{
          width: '600px',  // ajusta tamaño
          maxWidth: '80%', // para que no se corte en móviles
          borderRadius: 2, // bordes redondeados opcional
          mb: 3, // espacio debajo de la imagen
          boxShadow: 3, // sombra ligera
        }}
      />

      {/* Texto debajo */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
        Sistema de Administración View
      </Typography>
    </Box>
  );
}
