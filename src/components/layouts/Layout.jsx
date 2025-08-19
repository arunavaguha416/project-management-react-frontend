import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from '../blocks/Sidebar';
import '../../assets/css/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* <Header /> */}
        <main className="content-area">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
