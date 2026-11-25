// Auth state: user, login, register, logout; restores session via /auth/me.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, setUnauthorizedHandler } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => { localStorage.removeItem('token'); setUser(null); }, []);
  const start = ({ token, user: u }) => { localStorage.setItem('token', token); setUser(u); };

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!localStorage.getItem('token')) return;
    authApi.me().then(setUser).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const login = async (b) => start(await authApi.login(b));
  const register = async (b) => start(await authApi.register(b));
  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
