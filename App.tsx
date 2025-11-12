import React, { useState, useMemo, useCallback } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
// Fix: Import User from './types' instead of './contexts/AuthContext' which doesn't export it.
import { AuthContext } from './contexts/AuthContext';
import { User } from './types';
import { mockUsers } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('pickpointUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // A simple check to see if the stored user is valid
      const foundUser = mockUsers.find(u => u.id === parsedUser.id && u.email === parsedUser.email);
      return foundUser || null;
    }
    return null;
  });

  const login = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('pickpointUser', JSON.stringify(loggedInUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pickpointUser');
  }, []);

  const authContextValue = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {user ? <DashboardLayout /> : <LoginPage />}
      </div>
    </AuthContext.Provider>
  );
}

export default App;