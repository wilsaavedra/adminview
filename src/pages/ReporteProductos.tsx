import React from "react";
import { Box, Typography } from "@mui/material";

export default function ReporteProductos() {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Reportes · Productos
      </Typography>

      <Typography sx={{ color: "#666" }}>
        Aquí irá el reporte de productos (en construcción).
      </Typography>
    </Box>
  );
}