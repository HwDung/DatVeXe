import React, { useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import { useNavigate } from 'react-router-dom';

const getStoredBooking = () => {
  try {
    const stored = sessionStorage.getItem('rightwayBooking');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
};

const parsePrice = (value) => {
  const normalized = Number(String(value || '0').replace(/[^\d]/g, ''));
  return Number.isNaN(normalized) ? 0 : normalized;
};

const PassengerInfoPage = () => {
  const navigate = useNavigate();
  const booking = getStoredBooking();
  const trip = booking.trip || {};
  const selectedSeats = Array.isArray(booking.selectedSeats) ? booking.selectedSeats : [];
  const tripPrice = parsePrice(trip.price || '300000');
  const totalAmount = selectedSeats.length * tripPrice;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    agree: false,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedSeats.length) {
      navigate('/booking/seats');
      return;
    }

    if (!formData.name || !formData.phone || !formData.email || !formData.agree) {
      alert('Vui lòng điền đầy đủ thông tin và chấp nhận điều khoản.');
      return;
    }

    const nextBooking = {
      ...booking,
      trip,
      selectedSeats,
      passenger: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      },
    };

    sessionStorage.setItem('rightwayBooking', JSON.stringify(nextBooking));
    navigate('/booking/payment');
  };

  return (
    <div className="booking-page">
      <BookingSteps currentStep={3} />

      <div className="container booking-layout" style={{ marginTop: '30px' }}>
        <div className="booking-main">
          <h2 className="summary-title">Thông tin hành khách</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-section-title">Người đặt vé</div>

            <div className="form-grid">
              <div className="input-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                />
              </div>

              <div className="input-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>

              <div className="input-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-light)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.agree}
                  onChange={(event) => setFormData((current) => ({ ...current, agree: event.target.checked }))}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
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
              <span className="summary-value">{trip.origin || 'TP.HCM'} → {trip.destination || 'Đà Lạt'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Giờ khởi hành</span>
              <span className="summary-value">{trip.departureTime || '22:00'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">{selectedSeats.length ? selectedSeats.join(', ') : 'Chưa chọn'}</span>
            </div>
          </div>

          <div className="summary-total">
            <span className="total-label">Tổng tiền</span>
            <span className="total-amount">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            className="btn-primary btn-full"
            type="submit"
            onClick={handleSubmit}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassengerInfoPage;
