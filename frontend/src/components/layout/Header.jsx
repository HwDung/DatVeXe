import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Tìm vé', path: '/search' },
    { name: 'Tra cứu vé', path: '/lookup' },
    { name: 'Chuyến đi', path: '/search' },
    { name: 'Ưu đãi', path: '#' },
    { name: 'Tin tức', path: '#' },
  ];

  const handleLogout = async () => {
    if (logout) await logout();
    navigate('/');
  };

  const displayName = user?.fullName || user?.email || 'Tài khoản';

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">Rightway</Link>

        <nav className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="header-user">
              <i className="bi bi-person-circle"></i>
              <span className="header-user-name">{displayName}</span>
              {isAdmin ? <Link to="/admin" className="header-admin-link">Admin</Link> : null}
              <button type="button" className="header-logout" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className="auth-link">
              <i className="bi bi-person-circle"></i>
              <span>Đăng nhập / Đăng ký</span>
            </Link>
          )}
          <button type="button" className="lang-btn" aria-label="Ngôn ngữ">
            <i className="bi bi-globe"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
