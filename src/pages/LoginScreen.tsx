/*import React, { useState, useContext, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from '../assets/View3.png';

export default function LoginScreen() {
  const { signIn, errorMessage, removeError, status } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detecta login exitoso y redirige
  useEffect(() => {
    if (status === 'authenticated') {
      setSuccess(true);
      const timer = setTimeout(() => {
        setSuccess(false);
        navigate('/Menu'); // Redirecciona a Menu
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
        justifyContent: 'center', // Centrado vertical
        alignItems: 'center',     // Centrado horizontal
        backgroundColor: '#ffffff',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      {/* Logo responsivo */}
      <Box sx={{ mb: { xs: 3, sm: 5 } }}>
        <img
          src={Logo}
          alt="Logo"
          style={{
            width: '20vw',
            maxWidth: '140px',
            minWidth: '80px',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
          }}
        />
      </Box>

      {/* Inputs y botón */}
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
           // disabled={!email || !password || loading}
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

