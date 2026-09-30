import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

const LoginPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng nhập</h1>
          <p>Chào mừng bạn quay lại với Rightway</p>
        </div>
        
        <form className="auth-form">
          <div className="auth-input-group">
            <label>Số điện thoại / Email</label>
            <input type="text" placeholder="Nhập số điện thoại hoặc email" />
          </div>
          
          <div className="auth-input-group">
            <label>Mật khẩu</label>
            <input type="password" placeholder="Nhập mật khẩu" />
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
              <input type="checkbox" style={{accentColor: 'var(--primary)'}} />
              <span>Ghi nhớ</span>
            </label>
            <Link to="#" style={{color: 'var(--primary)', fontWeight: 600}}>Quên mật khẩu?</Link>
          </div>
          
          <button type="submit" className="btn-primary auth-btn">
            Đăng nhập
          </button>
        </form>
        
        <div className="auth-divider">hoặc</div>
        
        <button className="btn-outline auth-btn" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text)', borderColor: 'var(--border)'}}>
          <i className="bi bi-google" style={{color: '#EA4335'}}></i>
          Đăng nhập với Google
        </button>
        
        <div className="auth-links">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
