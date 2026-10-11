import React, { useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api';
import '../styles/booking.css';

const getStoredBooking = () => {
  try {
    const raw = sessionStorage.getItem('rightwayBooking');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const MomoFallbackBadge = () => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#A50064',
    color: '#FFFFFF',
    fontWeight: 900,
    fontSize: '11px',
    lineHeight: 1.1,
    textAlign: 'center',
  }}>
    MO<br />MO
  </span>
);

const VnpayFallbackBadge = () => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 900,
    fontSize: '16px',
    letterSpacing: '-0.5px',
  }}>
    <span style={{ color: '#005BAA' }}>VN</span>
    <span style={{ color: '#ED1C24' }}>PAY</span>
  </span>
);

const generateBookingCode = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `RW-${yy}${mm}${dd}-${rand}`;
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const stored = getStoredBooking();
  const booking = location.state || stored;
  const trip = booking.trip || stored.trip || {
    id: 'trip-hcm-dl-01',
    origin: 'TP.HCM',
    destination: 'Đà Lạt',
    departureTime: '22:00',
    arrivalTime: '05:30',
    company: 'Thành Bưởi',
    price: 300000,
  };

  const selectedSeats = Array.isArray(booking.selectedSeats) && booking.selectedSeats.length > 0
    ? booking.selectedSeats
    : (Array.isArray(stored.selectedSeats) && stored.selectedSeats.length > 0 ? stored.selectedSeats : ['A1']);

  const passenger = booking.passenger || stored.passenger || {
    name: user?.fullName || 'Nguyễn Văn A',
    phone: '0901234567',
    email: user?.email || 'nguyenvana@gmail.com',
  };

  const departureDate = booking.departureDate || stored.departureDate || 'Hôm nay';
  const totalAmount = booking.totalAmount || stored.totalAmount || (selectedSeats.length * 300000);

  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoImgError, setMomoImgError] = useState(false);
  const [vnpayImgError, setVnpayImgError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const confirmBooking = async () => {
    setSubmitting(true);
    const bookingCode = generateBookingCode();
    const completedBooking = {
      ...booking,
      id: `ticket_${Date.now()}`,
      bookingCode,
      trip,
      passenger,
      selectedSeats,
      departureDate,
      paymentMethod,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      userId: user?.id || null,
    };

    // 1. Lưu vào session và lịch sử localStorage
    sessionStorage.setItem('lastCompletedBooking', JSON.stringify(completedBooking));
    try {
      const storedBookings = JSON.parse(localStorage.getItem('rightwayBookings') || '[]');
      storedBookings.unshift(completedBooking);
      localStorage.setItem('rightwayBookings', JSON.stringify(storedBookings));
    } catch {
      // bỏ qua lỗi storage
    }

    // 2. Thử gọi backend API
    try {
      if (trip?.id) {
        await bookingService.create({
          userId: user?.id || null,
          tripId: trip.id,
          tripDate: departureDate,
          seatCode: selectedSeats.join(', '),
          passengerName: passenger.name,
          passengerPhone: passenger.phone,
          passengerEmail: passenger.email,
          paymentMethod,
          totalPrice: totalAmount,
        });
      }
    } catch {
      // Cho phép offline / mock tiếp tục
    }

    sessionStorage.removeItem('rightwayBooking');
    navigate('/booking/success', { state: { booking: completedBooking } });
  };

  const routeTitle = `${trip.origin || 'TP.HCM'} → ${trip.destination || 'Đà Lạt'}`;

  return (
    <div className="booking-page">
      <BookingSteps currentStep={4} />

      <div className="container booking-layout" style={{ marginTop: '30px' }}>
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
              {!momoImgError ? (
                <img
                  src="/momo-logo.svg"
                  alt="MoMo"
                  style={{ height: '32px', width: '32px', borderRadius: '6px' }}
                  onError={() => setMomoImgError(true)}
                />
              ) : (
                <MomoFallbackBadge />
              )}
              <span style={{ fontWeight: 600 }}>Thanh toán qua ví MoMo</span>
            </label>

            <label className={`payment-method ${paymentMethod === 'vnpay' ? 'active' : ''}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'vnpay'}
                onChange={() => setPaymentMethod('vnpay')}
              />
              {!vnpayImgError ? (
                <img
                  src="/vnpay-logo.svg"
                  alt="VNPAY"
                  style={{ height: '28px', maxWidth: '80px' }}
                  onError={() => setVnpayImgError(true)}
                />
              ) : (
                <VnpayFallbackBadge />
              )}
              <span style={{ fontWeight: 600 }}>Thanh toán qua VNPAY</span>
            </label>

            <label className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <i className="bi bi-credit-card" style={{ fontSize: '30px', color: 'var(--primary)' }}></i>
              <span style={{ fontWeight: 600 }}>Thẻ Visa/Mastercard/JCB</span>
            </label>

            <label className={`payment-method ${paymentMethod === 'atm' ? 'active' : ''}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'atm'}
                onChange={() => setPaymentMethod('atm')}
              />
              <i className="bi bi-bank" style={{ fontSize: '30px', color: 'var(--primary)' }}></i>
              <span style={{ fontWeight: 600 }}>Thẻ ATM nội địa</span>
            </label>
          </div>
        </div>

        <div className="booking-sidebar">
          <h2 className="summary-title">Thông tin đặt vé</h2>

          <div className="summary-details">
            <div className="summary-row">
              <span className="summary-label">Tuyến đường</span>
              <span className="summary-value">{routeTitle}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hành khách</span>
              <span className="summary-value">{passenger.name}</span>
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
            <span className="total-label">Tổng tiền thanh toán</span>
            <span className="total-amount">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            className="btn-primary btn-full"
            disabled={submitting}
            onClick={confirmBooking}
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
