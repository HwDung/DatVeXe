import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingService } from '../services/api';
import '../styles/auth.css';
//
const BookingLookupPage = () => {
  const [searchParams] = useSearchParams();
  const [bookingCode, setBookingCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (codeToSearch, phoneToSearch) => {
    const code = (codeToSearch || bookingCode).trim();
    const tel = (phoneToSearch || phone).trim();

    if (!code) {
      setError('Vui lòng nhập mã đặt vé');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Thử gọi API backend
      if (tel) {
        try {
          const res = await bookingService.lookup(code, tel);
          if (res?.data) {
            setResult(res.data);
            setLoading(false);
            return;
          }
        } catch {
          // Bỏ qua nếu API 404 hoặc backend mock
        }
      }

      // 2. Tra cứu trong storage cục bộ
      const lastCompleted = (() => {
        try {
          return JSON.parse(sessionStorage.getItem('lastCompletedBooking') || 'null');
        } catch {
          return null;
        }
      })();

      const history = (() => {
        try {
          return JSON.parse(localStorage.getItem('rightwayBookings') || '[]');
        } catch {
          return [];
        }
      })();

      const allBookings = [
        ...(lastCompleted ? [lastCompleted] : []),
        ...(Array.isArray(history) ? history : []),
      ];

      const found = allBookings.find((b) => {
        const matchesCode = b.bookingCode?.toLowerCase() === code.toLowerCase();
        if (!matchesCode) return false;
        if (!tel) return true;
        const bPhone = b.passenger?.phone || b.passengerPhone || '';
        return bPhone.includes(tel) || tel.includes(bPhone);
      });

      if (found) {
        setResult(found);
      } else {
        setError('Không tìm thấy thông tin đặt vé với mã và số điện thoại trên.');
        setResult(null);
      }
    } catch {
      setError('Đã có lỗi xảy ra khi tra cứu. Vui lòng thử lại.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialCode = searchParams.get('code');
    const initialPhone = searchParams.get('phone');
    if (initialCode) {
      setBookingCode(initialCode);
      if (initialPhone) setPhone(initialPhone);
      handleLookup(initialCode, initialPhone);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLookup(bookingCode, phone);
  };

  const seatsText = result?.selectedSeats
    ? (Array.isArray(result.selectedSeats) ? result.selectedSeats.join(', ') : result.selectedSeats)
    : (result?.seatCode || 'A1');

  const routeText = result?.trip?.origin && result?.trip?.destination
    ? `${result.trip.origin} → ${result.trip.destination}`
    : (result?.trip?.route?.origin && result?.trip?.route?.destination
      ? `${result.trip.route.origin} → ${result.trip.route.destination}`
      : 'TP.HCM → Đà Lạt');

  const passengerName = result?.passenger?.name || result?.passengerName || 'Hành khách';
  const passengerPhone = result?.passenger?.phone || result?.passengerPhone || phone;
  const totalPrice = result?.totalAmount || result?.totalPrice || 0;
  const departureTime = result?.trip?.departureTime || '14:00';
  const company = result?.trip?.company || result?.trip?.bus?.company?.name || 'Phương Trang';
  const travelDate = result?.departureDate
    || (result?.tripDate ? new Date(result.tripDate).toLocaleDateString('vi-VN') : '')
    || new Date().toLocaleDateString('vi-VN');

  return (
    <div className="auth-container" style={{ padding: '40px 20px', minHeight: 'calc(100vh - 80px - 280px)' }}>
      <div className="lookup-form" style={{ maxWidth: '640px', width: '100%' }}>
        <div className="auth-header">
          <h1>Tra cứu thông tin đặt vé</h1>
          <p>Nhập mã đặt vé và số điện thoại để kiểm tra thông tin vé xe</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-error">{error}</div> : null}

          <div className="auth-input-group">
            <label htmlFor="lookup-code">Mã đặt vé *</label>
            <input
              id="lookup-code"
              type="text"
              placeholder="VD: RW-250925-0147"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="lookup-phone">Số điện thoại *</label>
            <input
              id="lookup-phone"
              type="tel"
              placeholder="Số điện thoại dùng để đặt vé"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </form>

        {/* Kết quả chi tiết vé tra cứu */}
        {result ? (
          <div className="success-card" style={{ marginTop: '30px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 className="success-card-title" style={{ margin: 0 }}>Chi tiết vé xe</h2>
              <span style={{
                background: '#DEF7EC',
                color: '#03543F',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {result.status === 'confirmed' || result.status === 'paid' ? 'Đã thanh toán' : 'Đã xác nhận'}
              </span>
            </div>

            <div className="success-info-grid">
              <div className="success-info-item">
                <span className="success-info-label">Mã đặt vé</span>
                <span className="success-info-value">{result.bookingCode || bookingCode}</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Tuyến đường</span>
                <span className="success-info-value">{routeText}</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Ngày đi</span>
                <span className="success-info-value">{travelDate}</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Giờ khởi hành</span>
                <span className="success-info-value">{departureTime}</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Chỗ ngồi</span>
                <span className="success-info-value">{seatsText}</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Hành khách</span>
                <span className="success-info-value">{passengerName} ({passengerPhone})</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Hãng xe</span>
                <span className="success-info-value">{company}</span>
              </div>

              <div className="success-info-item">
                <span className="success-info-label">Tổng thanh toán</span>
                <span className="success-info-value success-price">
                  {Number(totalPrice).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BookingLookupPage;
