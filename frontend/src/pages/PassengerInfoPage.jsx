import React from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import { useNavigate } from 'react-router-dom';

const PassengerInfoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="booking-page">
      <BookingSteps currentStep={3} />
      
      <div className="container booking-layout" style={{marginTop: '30px'}}>
        <div className="booking-main">
          <h2 className="summary-title">Thông tin hành khách</h2>
          
          <form>
            <div className="form-section-title">Người đặt vé</div>
            
            <div className="form-grid">
              <div className="input-group">
                <label>Họ tên *</label>
                <input type="text" placeholder="Nhập họ và tên" />
              </div>
              
              <div className="input-group">
                <label>Số điện thoại *</label>
                <input type="tel" placeholder="Nhập số điện thoại" />
              </div>
              
              <div className="input-group">
                <label>Email *</label>
                <input type="email" placeholder="Nhập email" />
              </div>
            </div>
            
            <div style={{marginTop: '20px', fontSize: '14px', color: 'var(--text-light)'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                <input type="checkbox" style={{accentColor: 'var(--primary)', width: '16px', height: '16px'}} />
                <span>Tôi chấp nhận điều khoản và chính sách của Rightway</span>
              </label>
            </div>
          </form>
        </div>
        
        <div className="booking-sidebar">
          <h2 className="summary-title">Thông tin đặt vé</h2>
          
          <div className="summary-details">
            <div className="summary-row">
              <span className="summary-label">Tuyến đường</span>
              <span className="summary-value">TP.HCM → Đà Lạt</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Giờ khởi hành</span>
              <span className="summary-value">22:00</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">A1</span>
            </div>
          </div>
          
          <div className="summary-total">
            <span className="total-label">Tổng tiền</span>
            <span className="total-amount">300.000đ</span>
          </div>
          
          <button 
            className="btn-primary btn-full" 
            onClick={() => navigate('/booking/payment')}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassengerInfoPage;
