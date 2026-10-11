import React, { useEffect, useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import SearchHeader from '../components/search/SearchHeader';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/booking.css';

const getStoredBooking = () => {
  try {
    const raw = sessionStorage.getItem('rightwayBooking');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const parsePrice = (val) => {
  const n = Number(String(val || '0').replace(/[^\d]/g, ''));
  return Number.isNaN(n) || n <= 0 ? 300000 : n;
};

const SeatSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stored = getStoredBooking();
  const trip = location.state?.trip || stored.trip || {
    id: 'trip-hcm-dl-01',
    origin: 'TP.HCM',
    destination: 'Đà Lạt',
    departureTime: '22:00',
    arrivalTime: '05:30',
    company: 'Thành Bưởi',
    price: 300000,
  };

  const [activeFloor, setActiveFloor] = useState('lower');
  const [selectedSeats, setSelectedSeats] = useState(() => {
    return Array.isArray(stored.selectedSeats) ? stored.selectedSeats : [];
  });

  const tripPrice = parsePrice(trip.price);
  const totalAmount = selectedSeats.length * tripPrice;
  const departureDate = searchParams.get('date') || stored.departureDate || 'Hôm nay';

  useEffect(() => {
    const current = getStoredBooking();
    sessionStorage.setItem('rightwayBooking', JSON.stringify({
      ...current,
      trip,
      selectedSeats,
      totalAmount,
      departureDate,
    }));
  }, [trip, selectedSeats, totalAmount, departureDate]);

  const floorSeats = {
    lower: ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3', 'A4', 'B4', 'C4'],
    upper: ['A5', 'B5', 'C5', 'A6', 'B6', 'C6', 'A7', 'B7', 'C7', 'A8', 'B8', 'C8'],
  };

  const bookedSeats = ['A2', 'C1', 'B3'];

  const renderSeats = () => {
    const seats = floorSeats[activeFloor] || floorSeats.lower;
    return seats.map((id) => {
      const isBooked = bookedSeats.includes(id);
      const isSelected = selectedSeats.includes(id);

      let className = 'seat';
      if (isBooked) className += ' booked';
      else if (isSelected) className += ' selected';

      return (
        <div
          key={id}
          className={className}
          onClick={() => {
            if (isBooked) return;
            if (isSelected) {
              setSelectedSeats((prev) => prev.filter((s) => s !== id));
            } else {
              setSelectedSeats((prev) => [...prev, id]);
            }
          }}
        >
          {id}
        </div>
      );
    });
  };

  const handleContinue = () => {
    const payload = {
      ...stored,
      trip,
      selectedSeats,
      totalAmount,
      departureDate,
    };
    sessionStorage.setItem('rightwayBooking', JSON.stringify(payload));
    navigate('/booking/passenger', { state: payload });
  };

  const routeTitle = `${trip.origin || 'TP.HCM'} → ${trip.destination || 'Đà Lạt'}`;

  return (
    <div className="booking-page">
      <BookingSteps currentStep={2} />
      <SearchHeader passengers={String(selectedSeats.length || 1)} searchParams={searchParams} />

      <div className="container booking-layout" style={{ marginTop: '30px' }}>
        <div className="booking-main">
          <h2 className="summary-title">Chọn chỗ ngồi</h2>

          <div className="floor-tabs">
            <button
              className={`floor-tab ${activeFloor === 'lower' ? 'active' : ''}`}
              onClick={() => setActiveFloor('lower')}
            >
              Tầng dưới
            </button>
            <button
              className={`floor-tab ${activeFloor === 'upper' ? 'active' : ''}`}
              onClick={() => setActiveFloor('upper')}
            >
              Tầng trên
            </button>
          </div>

          <div className="seat-map-container">
            <div className="bus-front">
              <i className="bi bi-vinyl"></i>
              ĐẦU XE
            </div>

            <div className="seat-grid">
              {renderSeats()}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-box available"></div> Trống
              </div>
              <div className="legend-item">
                <div className="legend-box selected"></div> Đang chọn
              </div>
              <div className="legend-item">
                <div className="legend-box booked"></div> Đã đặt
              </div>
            </div>
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
            disabled={selectedSeats.length === 0}
            onClick={handleContinue}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
