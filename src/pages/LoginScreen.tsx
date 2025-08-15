// src/pages/LoginScreen.tsx
/*import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn, errorMessage, removeError, status } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Si el login es exitoso, mostramos snackbar de éxito
  useEffect(() => {
    if (status === 'authenticated') {
      setSuccess(true);
    }
  }, [status]);

  // Si hay error, mostramos snackbar de error
  useEffect(() => {
    if (errorMessage) {
      // Limpiamos snackbar después de 4s
      const timer = setTimeout(() => removeError(), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, removeError]);

  const handleLogin = async () => {
    await signIn({ correo: email, password });
    // signIn actualizará errorMessage o status automáticamente
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" gutterBottom align="center">
        Iniciar Sesión
      </Typography>

      <TextField
        label="Email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Box mt={2}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!email || !password}
          onClick={handleLogin}
        >
          Ingresar
        </Button>
      </Box>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={removeError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={removeError}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          ¡Felicidades! Login exitoso.
        </Alert>
      </Snackbar>
    </Paper>
  );
}*/
import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom'; // <--- Import
import { AuthContext } from '../context/AuthContext';
import Logo from '../assets/View3.png';

export default function LoginScreen() {
  const { signIn, errorMessage, removeError, status } = useContext(AuthContext);
  const navigate = useNavigate(); // <--- Hook de navegación

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detecta login exitoso y redirige
  useEffect(() => {
    if (status === 'authenticated') {
      setSuccess(true);
      // Espera 1 segundo para que el snackbar se vea y luego redirige
      const timer = setTimeout(() => {
        setSuccess(false);
        navigate('/menu'); // <--- Redirecciona a Menu
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  // Auto-remover errores
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => removeError(), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, removeError]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    await signIn({ correo: email, password });
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        p: 2,
      }}
    >
      {/* Logo responsivo */}
      <Box sx={{ mb: 5 }}>
        <img
          src={Logo}
          alt="Logo"
          style={{
            width: '20vw',
            maxWidth: '140px',
            minWidth: '80px',
            height: 'auto',
          }}
        />
      </Box>

      {/* Inputs */}
      <Box sx={{ width: 360, maxWidth: '90%' }}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#b0b0b0' },
              '&:hover fieldset': { borderColor: '#808080' },
              '&.Mui-focused fieldset': { borderColor: '#333333' },
            },
            '& .MuiInputBase-input': { fontSize: 16, paddingY: 1.5 },
          }}
        />

        <TextField
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#b0b0b0' },
              '&:hover fieldset': { borderColor: '#808080' },
              '&.Mui-focused fieldset': { borderColor: '#333333' },
            },
            '& .MuiInputBase-input': { fontSize: 16, paddingY: 1.5 },
          }}
        />

        {/* Botón login */}
        <Box mt={4}>
          <Button
            variant="contained"
            fullWidth
            disabled={!email || !password || loading}
            onClick={handleLogin}
            sx={{
              py: 1.4,
              fontWeight: 600,
              borderRadius: 3,
              backgroundColor: 'rgb(225,63,68)',
              color: '#fff',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgb(200,50,55)' },
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </Box>
      </Box>

      {/* Mensajes */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={removeError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={removeError}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={1000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success">¡Felicidades! Login exitoso.</Alert>
      </Snackbar>
    </Box>
  );
}
