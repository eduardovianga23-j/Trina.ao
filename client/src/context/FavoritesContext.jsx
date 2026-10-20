import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { favoritesAPI } from '../services/api';

/*
  Favoritos (coração).
  - Sem sessão: ficam guardados no navegador.
  - Com sessão: ficam guardados na conta (aparecem em qualquer dispositivo).
  - Ao entrar na conta, os favoritos do navegador passam para a conta.
  Uso: const { isFavorite, toggleFavorite, count, ids } = useFavorites();
*/
const FavoritesContext = createContext(null);
const KEY = 'trina_favoritos';

const readLocal = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};
const writeLocal = (ids) => {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* sem armazenamento */ }
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState(readLocal);
  const [ready, setReady] = useState(!user);
  const userKey = user?.token || null;
  const lastUser = useRef(undefined);

  // Muda a origem dos favoritos quando a pessoa entra ou sai da conta
  useEffect(() => {
    if (lastUser.current === userKey) return;
    lastUser.current = userKey;
    if (!userKey) {
      setIds(readLocal());
      setReady(true);
      return;
    }
    let cancel = false;
    setReady(false);
    (async () => {
      try {
        const local = readLocal();
        const { data } = local.length ? await favoritesAPI.merge(local) : await favoritesAPI.list();
        if (cancel) return;
        writeLocal([]); // já passaram para a conta
        setIds(data.ids);
      } catch {
        /* sem ligação: mantém o que havia */
      } finally {
        if (!cancel) setReady(true);
      }
    })();
    return () => { cancel = true; };
  }, [userKey]);

  const isFavorite = useCallback((id) => ids.includes(String(id)), [ids]);

  const toggleFavorite = useCallback(async (id) => {
    id = String(id);
    const adding = !ids.includes(id);
    const next = adding ? [...ids, id] : ids.filter((x) => x !== id);
    setIds(next); // muda logo no ecrã
    if (!userKey) return writeLocal(next);
    try {
      if (adding) await favoritesAPI.add(id);
      else await favoritesAPI.remove(id);
    } catch {
      setIds(ids); // falhou: volta atrás
    }
  }, [ids, userKey]);

  return (
    <FavoritesContext.Provider value={{ ids, count: ids.length, ready, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites tem de ser usado dentro de <FavoritesProvider>');
  return ctx;
};
