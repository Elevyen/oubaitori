import { createContext, useCallback, useEffect, useState } from "react";

export const AuthContext = createContext({
    user: null,
    ready: false,
    setUser: () => { },
    login: () => { },
    logout: () => { },
    updateUser: () => { }
});

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [ready, setReady] = useState(false);

    const persistUser = useCallback((u) => {
        try {
            if (u) localStorage.setItem("userData", JSON.stringify(u));
            else localStorage.removeItem("userData");
        } catch (e) { /* ignore */ }
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("userData");
            if (raw) setUserState(JSON.parse(raw));
        } catch (e) {
            setUserState(null);
        } finally {
            setReady(true);
        }
    }, []);

    const setUser = useCallback((u) => {
        setUserState(u);
        persistUser(u);
    }, [persistUser]);

    const login = useCallback(({ token, user: userObj }) => {
        try {
            if (token) localStorage.setItem("userToken", token);
            if (userObj) setUser(userObj);
        } catch (e) { /* ignore */ }
    }, [setUser]);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem("userToken");
            localStorage.removeItem("userData");
        } catch (e) { /* ignore */ }
        setUserState(null);
    }, []);

    const updateUser = useCallback((patch) => {
        setUserState(prev => {
            const next = { ...(prev || {}), ...patch };
            persistUser(next);
            return next;
        });
    }, [persistUser]);

    return (
        <AuthContext.Provider value={{ user, ready, setUser, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
