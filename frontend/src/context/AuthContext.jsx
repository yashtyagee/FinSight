import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Hardcoded credentials
const VALID_USERS = [
  {
    email: 'yashashvityagi182@gmail.com',
    password: 'Tyagi@12345',
    name: 'Yash Tyagi',
    initials: 'YT'
  },
  {
    email: 'nitin@gmail.com',
    password: 'password',
    name: 'Nitin',
    initials: 'N'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('finpulse_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('finpulse_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const inputEmail = email?.trim()?.toLowerCase();
    const inputPassword = password?.trim();
    
    const matchedUser = VALID_USERS.find(
      u => u.email.toLowerCase() === inputEmail && u.password === inputPassword
    );

    if (matchedUser) {
      const userData = {
        email: matchedUser.email,
        name: matchedUser.name,
        initials: matchedUser.initials,
      };
      setUser(userData);
      localStorage.setItem('finpulse_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('finpulse_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
