import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api';
import '../styles/auth.css';
import '../styles/booking.css';

const formatPrice = (val) => {
  return `${Number(val || 0).toLocaleString('vi-VN')}đ`;
};

const BookingLookupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('code') || '');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showManualLookup, setShowManualLookup] = useState(false);
  const [lookupCode, setLookupCode] = useState(searchParams.get('code') || '');
  const [lookupPhone, setLookupPhone] = useState(searchParams.get('phone') || '');
  const [lookupMessage, setLookupMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null); // xem modal vé điện tử
  const [copiedCode, setCopiedCode] = useState('');

  // Tải danh sách vé từ localStorage và session
  useEffect(() => {
    const loadAllBookings = () => {
      let list = [];
      try {
        const stored = JSON.parse(localStorage.getItem('rightwayBookings') || '[]');
        if (Array.isArray(stored)) list = stored;
      } catch {
        list = [];
      }

      try {
        const last = JSON.parse(sessionStorage.getItem('lastCompletedBooking') || 'null');
        if (last && !list.some((b) => b.bookingCode === last.bookingCode)) {
          list.unshift(last);
        }
      } catch {
        // ignore
      }

      // Nếu hoàn toàn chưa có vé nào trong storage, tạo 1 vé mặc định gần nhất để người dùng thấy giao diện trực quan
      if (list.length === 0) {
        const defaultSample = {
          id: 'sample_01',
          bookingCode: 'RW-250925-0147',
          trip: {
            origin: 'TP.HCM',
            destination: 'Đà Lạt',
            departureTime: '14:00',
            arrivalTime: '20:30',
            company: 'Phương Trang',
            price: 285000,
          },
          departureDate: '25/09/2025',
          passenger: {
            name: user?.fullName || 'Nguyễn Văn A',
            phone: '0901234567',
            email: user?.email || 'nguyenvana@gmail.com',
          },
          selectedSeats: ['A7'],
          paymentMethod: 'momo',
          totalAmount: 285000,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
        };
        list = [defaultSample];
        try {
          localStorage.setItem('rightwayBookings', JSON.stringify(list));
        } catch {
          // ignore
        }
      }

      setBookings(list);
    };

    loadAllBookings();
  }, [user]);

  // Nếu có query param ?code=..., tự động mở xem chi tiết vé đó
  useEffect(() => {
    const codeQuery = searchParams.get('code');
    if (codeQuery && bookings.length > 0) {
      const match = bookings.find((b) => b.bookingCode?.toLowerCase() === codeQuery.toLowerCase());
      if (match) {
        setSelectedTicket(match);
      }
    }
  }, [searchParams, bookings]);

  // Tra cứu vé thủ công từ mã + sđt
  const handleManualLookup = async (e) => {
    e.preventDefault();
    setLookupMessage('');
    const code = lookupCode.trim();
    const phone = lookupPhone.trim();

    if (!code) {
      setLookupMessage('Vui lòng nhập mã đặt vé.');
      return;
    }

    // 1. Tìm trong danh sách hiện có
    const localFound = bookings.find((b) => {
      const matchCode = b.bookingCode?.toLowerCase() === code.toLowerCase();
      if (!matchCode) return false;
      if (!phone) return true;
      const bPhone = b.passenger?.phone || b.passengerPhone || '';
      return bPhone.includes(phone);
    });

    if (localFound) {
      setSelectedTicket(localFound);
      setLookupMessage('Đã tìm thấy vé của bạn!');
      setShowManualLookup(false);
      return;
    }

    // 2. Thử gọi backend API
    try {
      if (phone) {
        const res = await bookingService.lookup(code, phone);
        if (res?.data) {
          const apiBooking = {
            ...res.data,
            id: res.data.id || `api_${Date.now()}`,
            trip: res.data.trip || {},
            passenger: {
              name: res.data.passengerName,
              phone: res.data.passengerPhone,
              email: res.data.passengerEmail,
            },
            selectedSeats: res.data.seatCode ? res.data.seatCode.split(',').map((s) => s.trim()) : ['A1'],
            totalAmount: res.data.totalPrice,
            departureDate: res.data.tripDate ? new Date(res.data.tripDate).toLocaleDateString('vi-VN') : 'Hôm nay',
          };
          setBookings((prev) => [apiBooking, ...prev]);
          setSelectedTicket(apiBooking);
          setShowManualLookup(false);
          return;
        }
      }
      setLookupMessage('Không tìm thấy vé khớp với thông tin cung cấp.');
    } catch {
      setLookupMessage('Không tìm thấy thông tin vé hoặc kết nối máy chủ thất bại.');
    }
  };

  // Hủy vé
  const handleCancelTicket = (bookingCode) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn hủy vé ${bookingCode} không?`);
    if (!confirmed) return;

    const updated = bookings.map((b) => {
      if (b.bookingCode === bookingCode) {
        return { ...b, status: 'cancelled' };
      }
      return b;
    });

    setBookings(updated);
    try {
      localStorage.setItem('rightwayBookings', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (selectedTicket?.bookingCode === bookingCode) {
      setSelectedTicket({ ...selectedTicket, status: 'cancelled' });
    }
  };

  // Copy mã vé
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Lọc vé
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Lọc theo trạng thái
      if (selectedFilter === 'confirmed' && b.status !== 'confirmed') return false;
      if (selectedFilter === 'cancelled' && b.status !== 'cancelled') return false;

      // Lọc theo tìm kiếm
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (b.bookingCode || '').toLowerCase();
        const origin = (b.trip?.origin || '').toLowerCase();
        const destination = (b.trip?.destination || '').toLowerCase();
        const passengerName = (b.passenger?.name || '').toLowerCase();
        const passengerPhone = (b.passenger?.phone || '').toLowerCase();

        return code.includes(q) || origin.includes(q) || destination.includes(q) || passengerName.includes(q) || passengerPhone.includes(q);
      }
      return true;
    });
  }, [bookings, selectedFilter, searchTerm]);

  return (
    <div className="my-bookings-page" style={{ backgroundColor: '#F8FAFC', minHeight: '80vh', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header trang */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Vé đã đặt của bạn
            </h1>
            <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>
              Quản lý danh sách vé xe và xuất trình vé điện tử khi lên xe
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setShowManualLookup(!showManualLookup)}
              style={{
                backgroundColor: showManualLookup ? '#E2E8F0' : '#FFFFFF',
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="bi bi-search"></i>
              {showManualLookup ? 'Đóng tra cứu' : 'Tra cứu mã khác'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/search')}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="bi bi-plus-lg"></i>
              Đặt thêm vé
            </button>
          </div>
        </div>

        {/* Khung tra cứu thủ công (hiển thị khi bấm nút) */}
        {showManualLookup && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1E293B' }}>
              Tra cứu vé bằng mã đặt chỗ & số điện thoại
            </h3>
            {lookupMessage ? (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '14px',
                fontSize: '14px',
                backgroundColor: lookupMessage.includes('thành công') || lookupMessage.includes('tìm thấy') ? '#DEF7EC' : '#FEF2F2',
                color: lookupMessage.includes('thành công') || lookupMessage.includes('tìm thấy') ? '#03543F' : '#B91C1C',
              }}>
                {lookupMessage}
              </div>
            ) : null}

            <form onSubmit={handleManualLookup} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) 120px', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Mã đặt vé *</label>
                <input
                  type="text"
                  placeholder="VD: RW-250925-0147"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="Số điện thoại đặt vé"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '11px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: '42px',
                }}
              >
                Tra cứu
              </button>
            </form>
          </div>
        )}

        {/* Thanh tìm kiếm & Tabs lọc */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}>
          {/* Tabs bộ lọc */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedFilter === 'all' ? '#0F172A' : '#E2E8F0',
                color: selectedFilter === 'all' ? '#FFFFFF' : '#475569',
              }}
            >
              Tất cả ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('confirmed')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedFilter === 'confirmed' ? '#16A34A' : '#E2E8F0',
                color: selectedFilter === 'confirmed' ? '#FFFFFF' : '#475569',
              }}
            >
              Đã xác nhận ({bookings.filter((b) => b.status === 'confirmed').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('cancelled')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedFilter === 'cancelled' ? '#64748B' : '#E2E8F0',
                color: selectedFilter === 'cancelled' ? '#FFFFFF' : '#475569',
              }}
            >
              Đã hủy ({bookings.filter((b) => b.status === 'cancelled').length})
            </button>
          </div>

          {/* Ô lọc nhanh */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Tìm theo mã vé, nơi đến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px 8px 36px',
                border: '1px solid #CBD5E1',
                borderRadius: '20px',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Danh sách vé xe */}
        {filteredBookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredBookings.map((ticket) => {
              const trip = ticket.trip || {};
              const passenger = ticket.passenger || {};
              const seats = Array.isArray(ticket.selectedSeats) ? ticket.selectedSeats.join(', ') : (ticket.seatCode || 'A1');
              const isCancelled = ticket.status === 'cancelled';

              return (
                <div
                  key={ticket.bookingCode || ticket.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    opacity: isCancelled ? 0.75 : 1,
                  }}
                >
                  {/* Top Bar của Vé */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 24px',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        fontWeight: 700,
                      }}>
                        <i className="bi bi-bus-front"></i>
                      </span>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                          {trip.company || 'Phương Trang'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          Mã vé:{' '}
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{ticket.bookingCode}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(ticket.bookingCode)}
                            title="Sao chép mã vé"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedCode === ticket.bookingCode ? '#16A34A' : '#64748B',
                              cursor: 'pointer',
                              marginLeft: '6px',
                              padding: '2px 4px',
                            }}
                          >
                            <i className={copiedCode === ticket.bookingCode ? 'bi bi-check2' : 'bi bi-copy'}></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCancelled ? (
                        <span style={{
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          Đã hủy
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          <i className="bi bi-check-circle-fill" style={{ marginRight: '6px' }}></i>
                          Đã xác nhận & Đã thanh toán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body của Vé */}
                  <div style={{ padding: '24px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '24px',
                    }}>
                      {/* Lộ trình chuyến */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                              {trip.departureTime || '14:00'}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                              {trip.origin || 'TP.HCM'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px' }}>
                            <span style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>
                              {trip.duration || '6h 30p'}
                            </span>
                            <div style={{ width: '100%', height: '2px', backgroundColor: '#CBD5E1', position: 'relative' }}>
                              <i className="bi bi-arrow-right" style={{
                                position: 'absolute',
                                right: '-4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94A3B8',
                                fontSize: '14px',
                              }}></i>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                              {trip.arrivalTime || '20:30'}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                              {trip.destination || 'Đà Lạt'}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#64748B' }}>
                          <i className="bi bi-calendar-event" style={{ marginRight: '6px' }}></i>
                          Ngày khởi hành: <strong style={{ color: '#1E293B' }}>{ticket.departureDate || '25/09/2025'}</strong>
                        </div>
                      </div>

                      {/* Chi tiết đặt chỗ */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        backgroundColor: '#F8FAFC',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                      }}>
                        <div>
                          <div style={{ color: '#64748B', marginBottom: '2px' }}>Hành khách</div>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{passenger.name || 'Nguyễn Văn A'}</div>
                          <div style={{ color: '#64748B', fontSize: '12px' }}>{passenger.phone || '0901234567'}</div>
                        </div>

                        <div>
                          <div style={{ color: '#64748B', marginBottom: '2px' }}>Chỗ ngồi</div>
                          <div style={{
                            fontWeight: 700,
                            color: '#DC2626',
                            fontSize: '15px',
                          }}>
                            {seats}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: '#64748B', marginBottom: '2px' }}>Thanh toán</div>
                          <div style={{ fontWeight: 600, color: '#1E293B' }}>
                            {ticket.paymentMethod === 'momo' ? 'Ví MoMo' : (ticket.paymentMethod === 'vnpay' ? 'VNPAY' : 'Thẻ / Trực tuyến')}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: '#64748B', marginBottom: '2px' }}>Tổng tiền</div>
                          <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '16px' }}>
                            {formatPrice(ticket.totalAmount || 285000)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer hành động của thẻ vé */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid #F1F5F9',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        Ngày đặt: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          style={{
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <i className="bi bi-qr-code"></i>
                          Xem vé điện tử
                        </button>

                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelTicket(ticket.bookingCode)}
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#64748B',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Hủy vé
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State khi chưa có vé */
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              marginBottom: '20px',
            }}>
              <i className="bi bi-ticket-perforated"></i>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              {searchTerm ? 'Không tìm thấy vé phù hợp' : 'Bạn chưa có vé nào đã đặt'}
            </h3>
            <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '420px', margin: '0 auto 24px' }}>
              {searchTerm
                ? 'Hãy thử tìm kiếm với mã đặt vé hoặc từ khóa khác.'
                : 'Hãy bắt đầu tìm kiếm chuyến xe yêu thích và đặt vé một cách nhanh chóng, an toàn ngay hôm nay.'}
            </p>

            <button
              type="button"
              onClick={() => navigate('/search')}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tìm chuyến xe ngay
            </button>
          </div>
        )}
      </div>

      {/* Modal hiển thị Vé điện tử (E-Ticket) */}
      {selectedTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}>
            {/* Header Modal */}
            <div style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                  Vé xe khách điện tử
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>
                  Rightway Bus E-Ticket
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Nội dung Vé */}
            <div style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                padding: '14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>MÃ ĐẶT VÉ CHÍNH THỨC</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', letterSpacing: '1px' }}>
                  {selectedTicket.bookingCode}
                </div>
                <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
                  ✓ Đã thanh toán & Xác nhận chỗ thành công
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Hành khách</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTicket.passenger?.name || 'Nguyễn Văn A'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Số điện thoại</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTicket.passenger?.phone || '0901234567'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Tuyến đường</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>
                    {selectedTicket.trip?.origin || 'TP.HCM'} → {selectedTicket.trip?.destination || 'Đà Lạt'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Hãng xe</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTicket.trip?.company || 'Phương Trang'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Ngày khởi hành</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTicket.departureDate || '25/09/2025'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Giờ xuất bến</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTicket.trip?.departureTime || '14:00'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Số ghế</div>
                  <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '16px' }}>
                    {Array.isArray(selectedTicket.selectedSeats) ? selectedTicket.selectedSeats.join(', ') : (selectedTicket.seatCode || 'A7')}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>Tổng thanh toán</div>
                  <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '16px' }}>
                    {formatPrice(selectedTicket.totalAmount || 285000)}
                  </div>
                </div>
              </div>

              {/* Barcode tượng trưng */}
              <div style={{
                textAlign: 'center',
                padding: '16px 0 0',
                borderTop: '1px solid #E2E8F0',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '42px',
                  alignItems: 'stretch',
                  marginBottom: '8px',
                }}>
                  {[12, 4, 8, 16, 6, 10, 4, 14, 8, 6, 12, 18, 4, 8, 10, 14, 6, 8, 12, 4, 16].map((w, i) => (
                    <div key={i} style={{ width: `${w}px`, backgroundColor: '#0F172A' }} />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Xuất trình mã vé hoặc mã vạch này cho nhân viên nhà xe khi lên xe
                </div>
              </div>

              {/* Nút đóng & in vé */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    backgroundColor: '#F1F5F9',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <i className="bi bi-printer" style={{ marginRight: '6px' }}></i> In vé
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{
                    flex: 1,
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingLookupPage;
