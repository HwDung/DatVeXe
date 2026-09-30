import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

const RegisterPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản để trải nghiệm tốt hơn cùng Rightway</p>
        </div>
        
        <form className="auth-form">
          <div className="auth-input-group">
            <label>Họ và tên *</label>
            <input type="text" placeholder="Nhập họ và tên" />
          </div>
          
          <div className="auth-input-group">
            <label>Số điện thoại *</label>
            <input type="tel" placeholder="Nhập số điện thoại" />
          </div>
          
          <div className="auth-input-group">
            <label>Email *</label>
            <input type="email" placeholder="Nhập email" />
          </div>
          
          <div className="auth-input-group">
            <label>Mật khẩu *</label>
            <input type="password" placeholder="Nhập mật khẩu (từ 6 ký tự)" />
          </div>
          
          <div className="auth-input-group">
            <label>Xác nhận mật khẩu *</label>
            <input type="password" placeholder="Nhập lại mật khẩu" />
          </div>
          
          <div style={{fontSize: '14px', color: 'var(--text-light)', marginTop: '10px'}}>
            Bằng việc đăng ký, bạn đồng ý với <Link to="#" style={{color: 'var(--primary)', fontWeight: 500}}>Điều khoản sử dụng</Link> và <Link to="#" style={{color: 'var(--primary)', fontWeight: 500}}>Chính sách bảo mật</Link> của Rightway.
          </div>
          
          <button type="submit" className="btn-primary auth-btn">
            Đăng ký
          </button>
        </form>
        
        <div className="auth-links">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
