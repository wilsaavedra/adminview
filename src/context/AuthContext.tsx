// src/context/AuthContext.tsx
import React, { createContext, useEffect, useReducer } from "react";
import { LoginData, LoginResponse, RegisterData, Usuario } from '../interfaces/appInterfaces';
import { AuthState, authReducer } from "./authReducer";
import cafeApi from "../api/cafeApi";

type AuthContextProps = {
  errorMessage: string;
  token: string | null;
  user: Usuario | null;
  status: 'checking' | 'authenticated' | 'not-authenticated';
  signUp: (registerData: RegisterData) => Promise<void>;
  signIn: (loginData: LoginData) => Promise<void>;
  logOut: () => void;
  removeError: () => void;
};

const authInitialState: AuthState = {
  status: 'checking',
  token: null,
  user: null,
  errorMessage: '',
};

export const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, authInitialState);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      return dispatch({ type: 'notAuthenticated' });
    }
  
    try {
      const resp = await cafeApi.get('/auth', {
        headers: { 'x-token': token }
      });
  
      if (resp.status !== 200) {
        return dispatch({ type: 'notAuthenticated' });
      }
  
      localStorage.setItem('token', resp.data.token);
      dispatch({
        type: 'signUp', // esto pasa automáticamente a 'authenticated'
        payload: {
          token: resp.data.token,
          user: resp.data.usuario
        }
      });
    } catch {
      dispatch({ type: 'notAuthenticated' });
    }
  };

  const signIn = async ({ correo, password }: LoginData) => {
    try {
      const { data } = await cafeApi.post<LoginResponse>('/auth/login', { correo, password });

      dispatch({
        type: 'signUp',
        payload: {
          token: data.token,
          user: data.usuario
        }
      });
      localStorage.setItem('token', data.token);

    } catch (error: any) {
      dispatch({
        type: 'addError',
        payload: error.response?.data?.msg || 'Información incorrecta'
      });
    }
  };

  const signUp = async ({ nombre, correo, password }: RegisterData) => {
    try {
      const { data } = await cafeApi.post<LoginResponse>('/usuarios', { correo, password, nombre });

      dispatch({
        type: 'signUp',
        payload: {
          token: data.token,
          user: data.usuario
        }
      });
      localStorage.setItem('token', data.token);

    } catch (error: any) {
      dispatch({
        type: 'addError',
        payload: error.response?.data?.errors?.[0]?.msg || 'Revise la información'
      });
    }
  };

  const logOut = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'logout' });
  };

  const removeError = () => {
    dispatch({ type: 'removeError' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signUp,
      signIn,
      logOut,
      removeError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
