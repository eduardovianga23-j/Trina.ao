import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('trina_user') || 'null'); } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readUser);
  const [checking, setChecking] = useState(Boolean(readUser()));

  const save = (data) => {
    setUser(data);
    localStorage.setItem('trina_user', JSON.stringify(data));
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('trina_user');
  }, []);

  // Ao abrir o site, confirma que a sessão guardada ainda é válida (e se o papel mudou)
  useEffect(() => {
    const stored = readUser();
    if (!stored?.token) return setChecking(false);
    authAPI
      .getMe()
      .then(({ data }) => save({ ...stored, name: data.name, email: data.email, role: data.role }))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // Se o servidor disser que a sessão expirou
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('trina:logout', onLogout);
    return () => window.removeEventListener('trina:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    save(data);
    return data;
  };

  // credential = token devolvido pelo botão da Google
  const loginWithGoogle = async (credential) => {
    const { data } = await authAPI.google(credential);
    const { created, ...session } = data;
    save(session);
    return { ...session, created };
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    save(data);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user, login, loginWithGoogle, register, logout, checking,
        // isOwner = administrador principal · isStaff = principal ou gestor (podem entrar no painel)
        isOwner: user?.role === 'admin',
        isStaff: ['admin', 'manager'].includes(user?.role),
        isAdmin: ['admin', 'manager'].includes(user?.role), // nome antigo, igual a isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tem de ser usado dentro de <AuthProvider>');
  return ctx;
};
