import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Check localStorage on load so you stay logged in on refresh
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('varsity_admin') === 'true';
  });

  const login = (password) => {
    // SIMPLE SECURITY: Hardcoded password for now
    if (password === 'admin123') { 
      setIsAdmin(true);
      localStorage.setItem('varsity_admin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('varsity_admin');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);