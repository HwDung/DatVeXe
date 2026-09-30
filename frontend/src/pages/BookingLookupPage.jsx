import React from 'react';
import '../styles/auth.css';

const BookingLookupPage = () => {
  return (
    <div className="auth-container">
      <div className="lookup-form">
        <div className="auth-header">
          <h1>Tra cứu thông tin đặt vé</h1>
          <p>Nhập mã đặt vé và số điện thoại để kiểm tra thông tin</p>
        </div>
        
        <form className="auth-form">
          <div className="auth-input-group">
            <label>Mã đặt vé *</label>
            <input type="text" placeholder="VD: RWAY123456" />
          </div>
          
          <div className="auth-input-group">
            <label>Số điện thoại *</label>
            <input type="tel" placeholder="Số điện thoại dùng để đặt vé" />
          </div>
          
          <button type="submit" className="btn-primary auth-btn">
            Tra cứu
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingLookupPage;
