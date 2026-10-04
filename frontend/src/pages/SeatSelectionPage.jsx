import React, { useState } from 'react';
import BookingSteps from '../components/booking/BookingSteps';
import SearchHeader from '../components/search/SearchHeader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/booking.css';

const SeatSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeFloor, setActiveFloor] = useState('lower');
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Mock seats
  const renderSeats = () => {
    const seats = [];
    const rows = 4;
    const cols = ['A', 'B', 'C'];
    
    for (let r = 1; r <= rows; r++) {
      for (const c of cols) {
        const id = `${c}${r}`;
        const isBooked = ['A2', 'C1', 'B3'].includes(id);
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
              if (isSelected) {
                setSelectedSeats(selectedSeats.filter(s => s !== id));
              } else {
                setSelectedSeats([...selectedSeats, id]);
              }
            }}
          >
            {id}
          </div>
        );
      }
    }
    return seats;
  };

  return (
    <div className="booking-page">
      <BookingSteps currentStep={2} />
      <SearchHeader passengers={searchParams.get('passengers') || '1'} searchParams={searchParams} />
      
      <div className="container booking-layout" style={{marginTop: '30px'}}>
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
              <span className="summary-value">TP.HCM → Đà Lạt</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Ngày đi</span>
              <span className="summary-value">Hôm nay</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Giờ khởi hành</span>
              <span className="summary-value">22:00</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hãng xe</span>
              <span className="summary-value">Thành Bưởi</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chỗ đã chọn</span>
              <span className="summary-value highlight">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}</span>
            </div>
          </div>
          
          <div className="summary-total">
            <span className="total-label">Tổng tiền</span>
            <span className="total-amount">{(selectedSeats.length * 300000).toLocaleString()}đ</span>
          </div>
          
          <button 
            className="btn-primary btn-full" 
            disabled={selectedSeats.length === 0}
            onClick={() => navigate('/booking/passenger')}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
