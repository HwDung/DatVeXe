import React, { useEffect, useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import SearchHeader from '../components/search/SearchHeader';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/booking.css';

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

const getBookedSeatsForTrip = (trip) => {
  const store = getSeatStore();
  const key = buildTripKey(trip);
  return Array.isArray(store[key]) ? store[key] : [];
};

const parsePrice = (value) => {
  const normalized = Number(String(value || '0').replace(/[^\d]/g, ''));
  return Number.isNaN(normalized) ? 0 : normalized;
};

const getPassengerCount = (searchParams, location, bookingData) => {
  const storedSearch = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('rightwaySearch') || '{}');
    } catch {
      return {};
    }
  })();

  const rawValue =
    searchParams.get('passengers') ||
    location.state?.passengers ||
    bookingData.passengers ||
    storedSearch.passengers ||
    new URLSearchParams(window.location.search).get('passengers') ||
    '4';

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 4;
  return Math.min(parsed, 4);
};

const SeatSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeFloor, setActiveFloor] = useState('lower');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerCount, setPassengerCount] = useState(() => getPassengerCount(searchParams, location, getStoredBooking()));

  const bookingData = getStoredBooking();
  const trip = location.state?.trip || bookingData.trip || null;

  useEffect(() => {
    const nextCount = getPassengerCount(searchParams, location, bookingData);
    setPassengerCount(nextCount);
  }, [searchParams, location, bookingData]);

  const maxSeatLimit = Math.max(passengerCount, 4);

  useEffect(() => {
    if (!trip) {
      const storedBooking = getStoredBooking();
      if (storedBooking.trip) {
        sessionStorage.setItem('rightwayBooking', JSON.stringify({ ...storedBooking, trip: storedBooking.trip }));
      } else {
        navigate('/search');
        return;
      }
    }

    const storedBooking = getStoredBooking();
    const storedSeats = Array.isArray(storedBooking.selectedSeats) ? storedBooking.selectedSeats : [];
    setSelectedSeats(storedSeats.slice(0, passengerCount));
  }, [navigate, passengerCount, trip]);

  useEffect(() => {
    if (!trip) return;

    const storedBooking = getStoredBooking();
    sessionStorage.setItem('rightwayBooking', JSON.stringify({
      ...storedBooking,
      trip,
      passengers: passengerCount,
      selectedSeats,
    }));
  }, [passengerCount, selectedSeats, trip]);

  const bookedSeats = Array.from(new Set([
    'A2',
    'C1',
    'B3',
    'A5',
    'C6',
    'B8',
    ...getBookedSeatsForTrip(trip),
  ]));
  const floorSeatMap = {
    lower: ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3', 'A4', 'B4', 'C4'],
    upper: ['A5', 'B5', 'C5', 'A6', 'B6', 'C6', 'A7', 'B7', 'C7', 'A8', 'B8', 'C8'],
  };

  const renderSeats = () => {
    const seats = [];
    const visibleSeats = floorSeatMap[activeFloor] || floorSeatMap.lower;

    visibleSeats.forEach((id) => {
      const isBooked = bookedSeats.includes(id);
      const isSelected = selectedSeats.includes(id);

      let className = 'seat';
      if (isBooked) className += ' booked';
      else if (isSelected) className += ' selected';

      seats.push(
        <div
          key={id}
          className={className}
          onClick={() => {
            if (isBooked) return;

            setSelectedSeats((currentSelected) => {
              if (currentSelected.includes(id)) {
                return currentSelected.filter((seat) => seat !== id);
              }

              if (currentSelected.length >= maxSeatLimit) {
                return currentSelected;
              }

              return [...currentSelected, id];
            });
          }}
        >
          {id}
        </div>
      );
    });

    return seats;
  };

  const routeText = trip ? `${trip.origin || 'TP.HCM'} → ${trip.destination || 'Đà Lạt'}` : 'TP.HCM → Đà Lạt';
  const tripPrice = parsePrice(trip?.price || '300000');
  const totalAmount = selectedSeats.length * tripPrice;

  return (
    <div className="booking-page">
      <BookingSteps currentStep={2} />
      <SearchHeader passengers={String(passengerCount)} searchParams={searchParams} />

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
              <span className="summary-value">{routeText}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Ngày đi</span>
              <span className="summary-value">Hôm nay</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Giờ khởi hành</span>
              <span className="summary-value">{trip?.departureTime || '22:00'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hãng xe</span>
              <span className="summary-value">{trip?.company || 'Thành Bưởi'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}</span>
            </div>
          </div>

          <div className="summary-total">
            <span className="total-label">Tổng tiền</span>
            <span className="total-amount">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            className="btn-primary btn-full"
            disabled={selectedSeats.length === 0}
            onClick={() => {
              const booking = getStoredBooking();
              sessionStorage.setItem('rightwayBooking', JSON.stringify({ ...booking, trip, selectedSeats }));
              navigate('/booking/passenger');
            }}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
