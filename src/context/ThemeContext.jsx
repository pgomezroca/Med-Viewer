// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

// Creamos el contexto
const ThemeContext = createContext();

// Hook personalizado para consumir el contexto
export const useTheme = () => useContext(ThemeContext);

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // ← SIEMPRE light

  // Función que ya no se usa, pero la dejamos si más adelante lo activás
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // localStorage.setItem('theme', newTheme);
  };

  // Aplicar clase al <body>
  useEffect(() => {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add('light-theme');
  }, []); // ← se ejecuta una sola vez

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
