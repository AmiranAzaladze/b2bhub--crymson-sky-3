import React from "react";
import api from "../api/client";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null); // null = checking, false = unauthed, object = authed
  const [ready, setReady] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!localStorage.getItem("sf_token")) {
      setUser(false);
      setReady(true);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("sf_token");
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("sf_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sf_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
