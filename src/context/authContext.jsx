import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const storedPermissions = JSON.parse(localStorage.getItem("permissions"));
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedPermissions && storedUser) {
      setPermissions(storedPermissions);
      setUser(storedUser);
    }
  }, []);

  const login = (userData, userPermissions) => {
    setUser(userData);
    setPermissions(userPermissions);
    localStorage.setItem("permissions", JSON.stringify(userPermissions));
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem("permissions");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const updatePermissions = (newPermissions) => {
    setPermissions(newPermissions);
    localStorage.setItem("permissions", JSON.stringify(newPermissions));
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, updatePermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
