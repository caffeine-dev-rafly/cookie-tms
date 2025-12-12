import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    username: 'Admin User',
    role: 'ADMIN', // Options: 'ADMIN', 'FINANCE', 'MECHANIC', 'DRIVER'
  });

  const login = (role) => {
    setUser({ username: `${role} User`, role });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
