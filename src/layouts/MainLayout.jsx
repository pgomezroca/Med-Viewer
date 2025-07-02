import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  console.log('mainlayout')
  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      <Navbar 
      
     />
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
