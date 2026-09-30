import React, { useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import { useNavigate } from 'react-router-dom';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('momo');

  return (
    <div className="booking-page">
      <BookingSteps currentStep={4} />
      
      <div className="container booking-layout" style={{marginTop: '30px'}}>
        <div className="booking-main">
          <h2 className="summary-title">Phương thức thanh toán</h2>
          
          <div className="payment-methods">
            <label className={`payment-method ${paymentMethod === 'momo' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'momo'} 
                onChange={() => setPaymentMethod('momo')} 
              />
              <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" style={{height: '30px'}} />
              <span style={{fontWeight: 600}}>Thanh toán qua ví MoMo</span>
            </label>
            
            <label className={`payment-method ${paymentMethod === 'vnpay' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'vnpay'} 
                onChange={() => setPaymentMethod('vnpay')} 
              />
              <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418189687.png" alt="VNPAY" style={{height: '30px'}} />
              <span style={{fontWeight: 600}}>Thanh toán qua VNPAY</span>
            </label>
            
            <label className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'card'} 
                onChange={() => setPaymentMethod('card')} 
              />
              <i className="bi bi-credit-card" style={{fontSize: '30px', color: 'var(--primary)'}}></i>
              <span style={{fontWeight: 600}}>Thẻ Visa/Mastercard/JCB</span>
            </label>
            
            <label className={`payment-method ${paymentMethod === 'atm' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'atm'} 
                onChange={() => setPaymentMethod('atm')} 
              />
              <i className="bi bi-bank" style={{fontSize: '30px', color: 'var(--primary)'}}></i>
              <span style={{fontWeight: 600}}>Thẻ ATM nội địa</span>
            </label>
          </div>
        </div>
        
        <div className="booking-sidebar">
          <h2 className="summary-title">Thông tin đặt vé</h2>
          
          <div className="summary-details">
            <div className="summary-row">
              <span className="summary-label">Tuyến đường</span>
              <span className="summary-value">TP.HCM → Đà Lạt</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hành khách</span>
              <span className="summary-value">Nguyễn Văn A</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">A1</span>
            </div>
          </div>
          
          <div className="summary-total">
            <span className="total-label">Tổng tiền thanh toán</span>
            <span className="total-amount">300.000đ</span>
          </div>
          
          <button 
            className="btn-primary btn-full" 
            onClick={() => {
              alert('Đặt vé thành công!');
              navigate('/');
            }}
          >
            Xác nhận đặt vé
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
