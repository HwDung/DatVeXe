import React, { useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/api';

const getStoredBooking = () => {
  try {
    const stored = sessionStorage.getItem('rightwayBooking');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
};

const getSeatStore = () => {
  try {
    const stored = localStorage.getItem('rightwayBookedSeats');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
};

const buildTripKey = (trip) => {
  if (!trip) return 'default-trip';
  return trip.id ? `trip:${trip.id}` : `${trip.origin || 'unknown'}-${trip.destination || 'unknown'}-${trip.departureTime || 'unknown'}`;
};

const saveBookedSeatsForTrip = (trip, seatIds) => {
  const store = getSeatStore();
  const key = buildTripKey(trip);
  store[key] = Array.from(new Set([...(store[key] || []), ...seatIds]));
  localStorage.setItem('rightwayBookedSeats', JSON.stringify(store));
};

const parsePrice = (value) => {
  const normalized = Number(String(value || '0').replace(/[^\d]/g, ''));
  return Number.isNaN(normalized) ? 0 : normalized;
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
  const booking = getStoredBooking();
  const trip = booking.trip || {};
  const selectedSeats = Array.isArray(booking.selectedSeats) ? booking.selectedSeats : [];
  const passenger = booking.passenger || {};
  const tripPrice = parsePrice(trip.price || '300000');
  const totalAmount = selectedSeats.length * tripPrice;
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoImgError, setMomoImgError] = useState(false);
  const [vnpayImgError, setVnpayImgError] = useState(false);
  const [processing, setProcessing] = useState(false);

  const confirmBooking = async () => {
    setProcessing(true);
    const bookingCode = generateBookingCode();
    const completedBooking = {
      ...booking,
      bookingCode,
      trip,
      passenger,
      selectedSeats,
      paymentMethod,
      totalAmount,
      departureDate: booking.departureDate || booking.tripDate || new Date().toLocaleDateString('vi-VN'),
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };

    if (trip && selectedSeats.length) {
      saveBookedSeatsForTrip(trip, selectedSeats);
    }

    // Persist completed booking to session and local history
    sessionStorage.setItem('lastCompletedBooking', JSON.stringify(completedBooking));
    try {
      const storedBookings = JSON.parse(localStorage.getItem('rightwayBookings') || '[]');
      storedBookings.unshift(completedBooking);
      localStorage.setItem('rightwayBookings', JSON.stringify(storedBookings));
    } catch {
      // Ignore storage errors
    }

    // Attempt backend sync
    try {
      if (trip?.id) {
        await bookingService.create({
          tripId: trip.id,
          tripDate: booking.tripDate || new Date().toISOString().slice(0, 10),
          seatCode: selectedSeats.join(', '),
          passengerName: passenger.name || 'Hành khách',
          passengerPhone: passenger.phone || '0900000000',
          passengerEmail: passenger.email || 'guest@rightway.com',
          paymentMethod,
        });
      }
    } catch {
      // Backend is optional/mock-friendly
    }

    sessionStorage.removeItem('rightwayBooking');
    navigate('/booking/success', { state: { booking: completedBooking } });
  };

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
              <span className="summary-value">{trip.origin || 'TP.HCM'} → {trip.destination || 'Đà Lạt'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hành khách</span>
              <span className="summary-value">{passenger.name || 'Nguyễn Văn A'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">
                {selectedSeats.length ? `${selectedSeats.join(', ')} (${selectedSeats.length} chỗ)` : 'Chưa chọn'}
              </span>
            </div>
          </div>

          <div className="summary-total">
            <span className="total-label">Tổng tiền thanh toán</span>
            <span className="total-amount">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            className="btn-primary btn-full"
            disabled={processing || selectedSeats.length === 0}
            onClick={confirmBooking}
          >
            {processing ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
