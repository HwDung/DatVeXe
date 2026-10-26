import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminApi';

const EMPTY_FILTERS = Object.freeze({
  search: '',
  fromDate: '',
  toDate: '',
  tripId: '',
  severity: '',
  reviewStatus: '',
});

const severityLabels = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

const reviewLabels = {
  open: 'Chờ rà soát',
  in_review: 'Đang kiểm tra',
  reviewed: 'Đã kiểm tra',
  false_positive: 'Xác nhận hợp lệ',
};

const AdminAnomalies = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });
  const [scanning, setScanning] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    fromDate: '',
    toDate: '',
    tripId: '',
    severity: '',
    reviewStatus: '',
  });
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAnomalies = useCallback(async (page = 1, currentFilters = EMPTY_FILTERS) => {
    setScanning(true);
    setError('');
    try {
      const params = { page, pageSize: pagination.pageSize };
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const response = await adminService.getAnomalies(params);
      setItems(response.data.items);
      setPagination(response.data.pagination);
      setScanLimitReached(response.data.scanLimitReached);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Không thể tải danh sách vé nghi vấn.');
    } finally {
      setScanning(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    let cancelled = false;
    const loadInitialResults = async () => {
      setScanning(true);
      try {
        const response = await adminService.getAnomalies({ page: 1, pageSize: 50 });
        if (cancelled) return;
        setItems(response.data.items);
        setPagination(response.data.pagination);
        setScanLimitReached(response.data.scanLimitReached);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.error?.message || 'Không thể tải danh sách vé nghi vấn.');
        }
      } finally {
        if (!cancelled) setScanning(false);
      }
    };
    loadInitialResults();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateReview = async (bookingId, status) => {
    setSavingId(bookingId);
    setError('');
    try {
      await adminService.updateAnomalyReview(bookingId, { status });
      await fetchAnomalies(pagination.page, filters);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Không thể cập nhật trạng thái rà soát.');
    } finally {
      setSavingId(null);
    }
  };

  const showAnomalyDetail = async (bookingId) => {
    setDetailLoading(true);
    setError('');
    try {
      const response = await adminService.getAnomalyDetail(bookingId);
      setSelectedAnomaly(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Không thể tải chi tiết phát hiện.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    fetchAnomalies(1, filters);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Kiểm tra vé nghi vấn</h2>
          <p style={{ margin: '6px 0 0', color: '#6B7280' }}>
            Điểm số hỗ trợ rà soát thủ công; hệ thống không tự động hủy hoặc thay đổi vé.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => fetchAnomalies(pagination.page, filters)} disabled={scanning}>
          <i className="bi bi-arrow-clockwise" /> {scanning ? 'Đang kiểm tra...' : 'Làm mới'}
        </button>
      </div>

      {scanLimitReached && (
        <div role="status" style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#FEF3C7', color: '#92400E' }}>
          Đã quét giới hạn 2.000 booking gần nhất. Hãy lọc theo ngày hoặc mã/tên để kiểm tra phạm vi hẹp hơn.
        </div>
      )}
      {error && <div role="alert" style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

      <form onSubmit={handleFilterSubmit} className="admin-filters" style={{ marginBottom: 18 }}>
        <input
          type="search"
          className="form-control"
          placeholder="Mã booking, tên, điện thoại hoặc email"
          aria-label="Tìm kiếm booking"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <input
          type="date"
          className="form-control"
          aria-label="Từ ngày đi"
          value={filters.fromDate}
          onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
        />
        <input
          type="text"
          className="form-control"
          placeholder="Mã chuyến xe"
          aria-label="Lọc theo chuyến xe"
          value={filters.tripId}
          onChange={(event) => setFilters((current) => ({ ...current, tripId: event.target.value }))}
        />
        <input
          type="date"
          className="form-control"
          aria-label="Đến ngày đi"
          value={filters.toDate}
          onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
        />
        <select
          className="form-control"
          aria-label="Mức rủi ro"
          value={filters.severity}
          onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))}
        >
          <option value="">Mọi mức rủi ro</option>
          <option value="high">Cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
        </select>
        <select
          className="form-control"
          aria-label="Trạng thái rà soát"
          value={filters.reviewStatus}
          onChange={(event) => setFilters((current) => ({ ...current, reviewStatus: event.target.value }))}
        >
          <option value="">Mọi trạng thái rà soát</option>
          <option value="open">Chờ rà soát</option>
          <option value="in_review">Đang kiểm tra</option>
          <option value="reviewed">Đã kiểm tra</option>
          <option value="false_positive">Xác nhận hợp lệ</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={scanning}>Lọc</button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            const cleared = { search: '', fromDate: '', toDate: '', tripId: '', severity: '', reviewStatus: '' };
            setFilters(cleared);
            fetchAnomalies(1, cleared);
          }}
        >
          Đặt lại
        </button>
      </form>

      <div className="admin-table-container">
        <div className="admin-table-header">
          <h3>Danh sách phát hiện</h3>
          <span>{pagination.total} kết quả</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Điểm / rủi ro</th>
                <th>Booking</th>
                <th>Chuyến / ngày</th>
                <th>Ghế</th>
                <th>Nguyên nhân</th>
                <th>Rà soát</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {scanning ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Đang phân tích dữ liệu...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Không có vé nghi vấn phù hợp bộ lọc.</td></tr>
              ) : items.map((item) => (
                <tr key={item.bookingId}>
                  <td>
                    <strong>{item.score}/100</strong>
                    <div style={{ color: item.severity === 'high' ? '#DC2626' : item.severity === 'medium' ? '#D97706' : '#2563EB' }}>
                      {severityLabels[item.severity]}
                    </div>
                  </td>
                  <td>
                    <strong>{item.bookingCode}</strong>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>{item.passengerName}</div>
                  </td>
                  <td>
                    <div>{item.route}</div>
                    <small>{new Date(item.tripDate).toLocaleDateString('vi-VN')} • {item.departureTime}</small>
                  </td>
                  <td>{item.seats.join(', ') || '—'}</td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {item.reasons.map((reason) => (
                        <li key={reason.code}>{reason.description} (+{reason.points})</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <div>{reviewLabels[item.review.status]}</div>
                    {item.review.note && <small>{item.review.note}</small>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingId === item.bookingId || item.review.status === 'in_review'}
                        onClick={() => updateReview(item.bookingId, 'in_review')}
                      >
                        Đang kiểm tra
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingId === item.bookingId || item.review.status === 'reviewed'}
                        onClick={() => updateReview(item.bookingId, 'reviewed')}
                      >
                        Đã xác nhận
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        disabled={savingId === item.bookingId || item.review.status === 'false_positive'}
                        onClick={() => updateReview(item.bookingId, 'false_positive')}
                      >
                        Hợp lệ
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => showAnomalyDetail(item.bookingId)}
                      >
                        Chi tiết
                      </button>
                      {item.review.status !== 'open' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          disabled={savingId === item.bookingId}
                          onClick={() => updateReview(item.bookingId, 'open')}
                        >
                          Mở lại
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <span>Trang {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={scanning || pagination.page <= 1}
              onClick={() => fetchAnomalies(pagination.page - 1, filters)}
            >
              Trước
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={scanning || pagination.page * pagination.pageSize >= pagination.total}
              onClick={() => fetchAnomalies(pagination.page + 1, filters)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
      {detailLoading && <div role="status">Đang tải chi tiết phát hiện...</div>}
      {selectedAnomaly && (
        <div
          role="presentation"
          onClick={() => setSelectedAnomaly(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,.5)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="anomaly-detail-title"
            onClick={(event) => event.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, padding: 24, width: 'min(640px, 100%)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="anomaly-detail-title">Chi tiết {selectedAnomaly.bookingCode}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedAnomaly(null)}>Đóng</button>
            </div>
            <p><strong>Điểm rủi ro:</strong> {selectedAnomaly.score}/100 — {severityLabels[selectedAnomaly.severity]}</p>
            <p><strong>Tuyến:</strong> {selectedAnomaly.route} • {new Date(selectedAnomaly.tripDate).toLocaleDateString('vi-VN')} • {selectedAnomaly.departureTime}</p>
            <p><strong>Trạng thái booking:</strong> {selectedAnomaly.bookingStatus} • <strong>Rà soát:</strong> {reviewLabels[selectedAnomaly.review.status]}</p>
            <p><strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAnomaly.booking.totalPrice)}</p>
            <h4>Vé</h4>
            <ul>
              {selectedAnomaly.booking.tickets.map((ticket) => (
                <li key={ticket.ticketCode}>
                  {ticket.ticketCode} — ghế {ticket.seatCode} — {ticket.passengerName} — {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticket.price)} — {ticket.status}
                </li>
              ))}
            </ul>
            <h4>Lý do phát hiện</h4>
            <ul>{selectedAnomaly.reasons.map((reason) => <li key={reason.code}>{reason.description} (+{reason.points})</li>)}</ul>
            {selectedAnomaly.relatedBookings.length > 0 && (
              <>
                <h4>Booking liên quan cùng chuyến</h4>
                <ul>
                  {selectedAnomaly.relatedBookings.map((booking) => (
                    <li key={booking.bookingCode}>{booking.bookingCode} — {booking.passengerName} — ghế {booking.seats.join(', ')} — {booking.bookingStatus}</li>
                  ))}
                </ul>
              </>
            )}
            {selectedAnomaly.review.note && <p><strong>Ghi chú rà soát:</strong> {selectedAnomaly.review.note}</p>}
          </section>
        </div>
      )}
    </section>
  );
};

export default AdminAnomalies;
