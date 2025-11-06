import React, { createContext, useContext, useState, useEffect } from 'react';
import usersData from '../../../data/users.json';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем localStorage при загрузке
    const savedUser = localStorage.getItem('autoexam_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Синхронизируем с актуальными данными из users.json
        const actualUser = usersData.users.find(u => u.username === parsedUser.username);
        if (actualUser) {
          const updatedUser = { ...actualUser };
          delete updatedUser.password;
          setUser(updatedUser);
          localStorage.setItem('autoexam_user', JSON.stringify(updatedUser));
        } else {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('autoexam_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Имитация проверки через JSON
    const foundUser = usersData.users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      localStorage.setItem('autoexam_user', JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, error: 'Неверное имя пользователя или пароль' };
  };

  const register = (username, password, name, email) => {
    // Проверка существования пользователя
    const exists = usersData.users.find((u) => u.username === username);
    if (exists) {
      return { success: false, error: 'Пользователь с таким именем уже существует' };
    }

    // Создание нового пользователя
    const newUser = {
      id: usersData.users.length + 1,
      username,
      name,
      email,
      theme: 'light',
      avatar: '/avatar.png',
      registeredAt: new Date().toISOString(),
    };

    // В реальном приложении здесь был бы API запрос
    // Для демо просто добавляем в память
    usersData.users.push({ ...newUser, password });
    
    const userWithoutPassword = { ...newUser };
    setUser(userWithoutPassword);
    localStorage.setItem('autoexam_user', JSON.stringify(userWithoutPassword));
    
    return { success: true, user: userWithoutPassword };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autoexam_user');
  };

  const updateUserTheme = (theme) => {
    if (user) {
      const updatedUser = { ...user, theme };
      setUser(updatedUser);
      localStorage.setItem('autoexam_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserTheme,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

