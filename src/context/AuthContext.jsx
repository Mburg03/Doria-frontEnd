import { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, clearAccessToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    // Initialize auth from refresh cookie (si existe)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const resRefresh = await api.post('/auth/refresh');
                const newToken = resRefresh.data?.token;
                if (newToken) {
                    setAccessToken(newToken);
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                }
            } catch (err) {
                clearAccessToken();
                setUser(null);
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token } = res.data;
        setAccessToken(token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        return userRes.data;
    };

    const register = async (name, email, password, dui) => {
        const res = await api.post('/auth/register', { name, email, password, dui });
        const { token } = res.data;
        setAccessToken(token);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        return userRes.data;
    };

    const logout = async () => {
        setLoggingOut(true);
        try {
            await api.post('/auth/logout');
        } catch (err) {
            // silencioso
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
        setAccessToken(null);
        clearAccessToken();
        setUser(null);
        setLoggingOut(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, loggingOut, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
