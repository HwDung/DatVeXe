import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TripCard = ({ trip, tripDate }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const savedSearch = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('rightwaySearch') || '{}');
    } catch {
      return {};
    }
  })();
  const passengers = searchParams.get('passengers') || savedSearch.passengers || '1';

  const formatCurrency = (amount) => {
    if (typeof amount === 'string' && amount.includes('đ')) return amount;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  const handleSelectTrip = () => {
    const params = new URLSearchParams();
    if (trip.id) params.set('tripId', trip.id);
    if (tripDate) params.set('date', tripDate);
    navigate(`/booking/seats?${params.toString()}`, { state: { trip } });
  };

  return (
    <div className="trip-card">
      <div className="trip-image">
        <img
          src={trip.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80'}
          alt={trip.company}
        />
      </div>

      <div className="trip-details">
        <div>
          <div className="trip-company-info">
            <div>
              <Link className="company-name trip-company-link" to={`/trips/${trip.id}`}>
                {trip.company}
              </Link>
              <div className="bus-type">{trip.busType}</div>
            </div>
            <div className="trip-rating">
              <i className="bi bi-star-fill"></i> {trip.rating || 4.5} {trip.reviews !== undefined ? `(${trip.reviews})` : ''}
            </div>
          </div>

          <div className="trip-time-info">
            <div className="time-block">
              <div className="time">{trip.departureTime}</div>
              <div className="city">{trip.origin}</div>
            </div>

            <div className="duration">
              <span>{trip.duration || '6h 00m'}</span>
            </div>

            <div className="time-block">
              <div className="time">{trip.arrivalTime}</div>
              <div className="city">{trip.destination}</div>
            </div>
          </div>
        </div>

        <div className="trip-footer">
          <div className="seats-left">
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {trip.seatsAvailable == null ? 'Còn chỗ' : `${trip.seatsAvailable} chỗ trống`}
            </span>
          </div>
          <div className="price-info">
            <div className="price-label">giá vé từ</div>
            <div className="price-amount">{formatCurrency(trip.price)}</div>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '10px', cursor: 'pointer' }}
              onClick={handleSelectTrip}
            >
              Chọn chuyến
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCard;
