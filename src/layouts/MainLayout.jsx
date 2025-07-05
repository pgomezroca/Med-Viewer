import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/MainLayout.module.css';

const MainLayout = () => {
  const { theme } = useTheme();
  return (
    <div className={styles.layoutWrapper}>
      <Navbar />
      <main className={`${styles.mainContent} ${theme === 'dark' ? styles.dark : styles.light}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
