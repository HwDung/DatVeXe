import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/header.css';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Tìm vé', path: '/search' },
    { name: 'Tra cứu vé', path: '/lookup' },
    { name: 'Chuyến đi', path: '#' },
    { name: 'Ưu đãi', path: '#' },
    { name: 'Tin tức', path: '#' },
  ];

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">Rightway</Link>
        
        <nav className="nav-links">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link to="/login" className="auth-link">
            <i className="bi bi-person-circle"></i>
            <span>Đăng nhập / Đăng ký</span>
          </Link>
          <button className="lang-btn">
            <i className="bi bi-globe"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
