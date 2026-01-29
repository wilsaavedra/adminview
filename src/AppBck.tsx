// src/App.tsx
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Fade } from "@mui/material";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./pages/LoginScreen";
import Menu from "./pages/Menu";
import Paquetes from "./pages/Paquetes";
import Reservar from "./pages/Reservar";
import Reservas from "./pages/Reservas";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pedidos from "./pages/Pedidos";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import MenuReservas from "./pages/MenuReservas";
import MenuReservasDetalle from "./pages/MenuReservasDetalle";
import QRsAdmin from "./pages/QRsAdmin";


type Role =
  | "ADMIN_ROLE"
  | "USER_ROLE"
  | "COCINA_ROLE"
  | "PARRILLA_ROLE"
  | "BAR_ROLE";

function PrivateRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/LoginScreen" replace />;

  const userRole = user.rol as Role;

  if (roles && !roles.includes(userRole) && userRole !== "ADMIN_ROLE") {
    return <Navigate to="/Menu" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const { status } = useContext(AuthContext);

  const showSidebar = location.pathname !== "/LoginScreen";

  if (status === "checking") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: { xs: "100svh", md: "100vh" },
          width: "100%",
          bgcolor: "#f7f7f8",
          flexDirection: "column",
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <p style={{ marginTop: 16, fontSize: 16, color: "#555" }}>Cargando...</p>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: { xs: "100svh", md: "100vh" },
        width: "100%",
      }}
    >
      {showSidebar && <Sidebar />}

<Fade in timeout={400}>
  <Box
    sx={{
      flexGrow: 1,
      width: "100%",
      ml: showSidebar ? { md: "260px" } : 0,
      boxSizing: "border-box",
      p: { xs: 2, sm: 3, md: 4 },

      // 👉 Permitimos que, si algún contenido (tabla) es más ancho,
      //     el contenedor principal tenga el ÚNICO scroll horizontal.
      overflowX: "auto",

      // 👉 Scroll vertical externo también aquí (solo uno, nada interno).
      overflowY: "auto",

      maxWidth: "100%",
    }}
  >
          <Routes>
            <Route
              path="/LoginScreen"
              element={
                status === "authenticated" ? (
                  <Navigate to="/Menu" replace />
                ) : (
                  <LoginScreen />
                )
              }
            />

            <Route
              path="/"
              element={
                status === "authenticated" ? (
                  <Navigate to="/Menu" replace />
                ) : (
                  <Navigate to="/LoginScreen" replace />
                )
              }
            />

            <Route
              path="/Menu"
              element={
                <PrivateRoute>
                  <Menu />
                </PrivateRoute>
              }
            />

            <Route
              path="/Reservar"
              element={
                <PrivateRoute>
                  <Reservar />
                </PrivateRoute>
              }
            />

            <Route
              path="/Reservas"
              element={
                <PrivateRoute>
                  <Reservas />
                </PrivateRoute>
              }
            />
           <Route
              path="/QRsAdmin"
              element={
                <PrivateRoute roles={["ADMIN_ROLE"]}>
                  <QRsAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="/MenuReservas"
              element={
                <PrivateRoute roles={["ADMIN_ROLE"]}>
                  <MenuReservas />
                </PrivateRoute>
              }
            />

            <Route
              path="/MenuReservasDetalle/:id"
              element={
                <PrivateRoute roles={["ADMIN_ROLE"]}>
                  <MenuReservasDetalle />
                </PrivateRoute>
              }
            />

            <Route
              path="/Pedidos"
              element={
                <PrivateRoute
                  roles={["ADMIN_ROLE", "BAR_ROLE", "COCINA_ROLE", "PARRILLA_ROLE"]}
                >
                  <Pedidos />
                </PrivateRoute>
              }
            />

            <Route
              path="*"
              element={
                status === "authenticated" ? (
                  <Navigate to="/Menu" replace />
                ) : (
                  <Navigate to="/LoginScreen" replace />
                )
              }
            />
          </Routes>
        </Box>
      </Fade>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AuthProvider>
  );
}

export default App;