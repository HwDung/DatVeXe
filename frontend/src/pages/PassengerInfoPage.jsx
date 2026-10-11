import React, { useEffect, useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/booking.css';

const getStoredBooking = () => {
  try {
    const raw = sessionStorage.getItem('rightwayBooking');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const PassengerInfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const stored = getStoredBooking();
  const booking = location.state || stored;
  const trip = booking.trip || stored.trip || {
    origin: 'TP.HCM',
    destination: 'Đà Lạt',
    departureTime: '22:00',
    company: 'Thành Bưởi',
    price: 300000,
  };

  const selectedSeats = Array.isArray(booking.selectedSeats)
    ? booking.selectedSeats
    : (Array.isArray(stored.selectedSeats) ? stored.selectedSeats : ['A1']);

  const departureDate = booking.departureDate || stored.departureDate || 'Hôm nay';
  const totalAmount = booking.totalAmount || stored.totalAmount || (selectedSeats.length * 300000);

  const [formData, setFormData] = useState({
    name: user?.fullName || stored.passenger?.name || '',
    phone: stored.passenger?.phone || '',
    email: user?.email || stored.passenger?.email || '',
    agree: true,
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.fullName || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setFormError('Vui lòng điền đầy đủ họ tên, số điện thoại và email.');
      return;
    }

    if (!formData.agree) {
      setFormError('Vui lòng đồng ý với điều khoản và chính sách của Rightway.');
      return;
    }

    const payload = {
      ...booking,
      trip,
      selectedSeats,
      departureDate,
      totalAmount,
      passenger: {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      },
    };

    sessionStorage.setItem('rightwayBooking', JSON.stringify(payload));
    navigate('/booking/payment', { state: payload });
  };

  const routeTitle = `${trip.origin || 'TP.HCM'} → ${trip.destination || 'Đà Lạt'}`;

  return (
    <div className="booking-page">
      <BookingSteps currentStep={3} />

      <div className="container booking-layout" style={{ marginTop: '30px' }}>
        <div className="booking-main">
          <h2 className="summary-title">Thông tin hành khách</h2>

          {formError ? (
            <div style={{
              background: '#FEF2F2',
              color: '#B91C1C',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #FECACA',
            }}>
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="form-section-title">Người đặt vé</div>

            <div className="form-grid">
              <div className="input-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={formData.name}
                  onChange={(e) => {
                    setFormError('');
                    setFormData({ ...formData, name: e.target.value });
                  }}
                  required
                />
              </div>

              <div className="input-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormError('');
                    setFormData({ ...formData, phone: e.target.value });
                  }}
                  required
                />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Nhập email nhận vé điện tử"
                  value={formData.email}
                  onChange={(e) => {
                    setFormError('');
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-light)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.agree}
                  onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
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
              <span className="summary-value">{routeTitle}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Ngày đi</span>
              <span className="summary-value">{departureDate}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Giờ khởi hành</span>
              <span className="summary-value">{trip.departureTime || '22:00'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hãng xe</span>
              <span className="summary-value">{trip.company || 'Thành Bưởi'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">
                {selectedSeats.length > 0
                  ? `${selectedSeats.join(', ')} (${selectedSeats.length} chỗ)`
                  : 'Chưa chọn'}
              </span>
            </div>
          </div>

          <div className="summary-total">
            <span className="total-label">Tổng tiền</span>
            <span className="total-amount">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            className="btn-primary btn-full"
            type="button"
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
