import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Reservas() {
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
        backgroundColor: '#ffffff', // Mantiene fondo blanco para el contenido
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Bienvenido a Paquetes opcion dos
      </Typography>
      <Typography sx={{ fontSize: 16, maxWidth: 600 }}>
        Aquí puedes colocar tu contenido profesional, productos, estadísticas, o lo que necesites.
      </Typography>
    </Box>
  );
}
