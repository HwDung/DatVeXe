import React, { useState } from 'react';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([
    { id: 'BK1001', passenger: 'Nguyễn Văn A', phone: '0901234567', route: 'Hà Nội - Sapa', date: '20/11/2025', seats: 'A1, A2', price: 700000, payment: 'Đã thanh toán', status: 'Đã xác nhận' },
    { id: 'BK1002', passenger: 'Trần Thị B', phone: '0912345678', route: 'TP.HCM - Đà Lạt', date: '21/11/2025', seats: 'B4', price: 250000, payment: 'Chưa thanh toán', status: 'Chờ xử lý' },
    { id: 'BK1003', passenger: 'Lê Văn C', phone: '0988776655', route: 'Đà Nẵng - Huế', date: '22/11/2025', seats: 'C3', price: 150000, payment: 'Đã hoàn tiền', status: 'Đã hủy' },
  ]);

  const [filterStatus, setFilterStatus] = useState('');

  const getStatusBadge = (status) => {
    if (status === 'Đã xác nhận') return <span className="badge badge-success">{status}</span>;
    if (status === 'Chờ xử lý') return <span className="badge badge-warning">{status}</span>;
    if (status === 'Đã hủy') return <span className="badge badge-danger">{status}</span>;
    return <span className="badge badge-info">{status}</span>;
  };

  const handleUpdateStatus = (id, newStatus) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const filteredBookings = filterStatus ? bookings.filter(b => b.status === filterStatus) : bookings;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Đặt vé</h2>
      </div>

      <div className="admin-table-container">
        <div className="admin-filters">
          <input type="text" className="form-control" placeholder="Tìm theo mã vé hoặc SĐT..." style={{ maxWidth: '300px' }} />
          <select className="form-control" style={{ maxWidth: '200px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Đã xác nhận">Đã xác nhận</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
          <input type="date" className="form-control" style={{ maxWidth: '200px' }} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Tuyến & Ngày</th>
                <th>Ghế</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.id}</strong></td>
                  <td>{b.passenger}</td>
                  <td>{b.phone}</td>
                  <td>{b.route}<br/><small style={{color: '#6B7280'}}>{b.date}</small></td>
                  <td>{b.seats}</td>
                  <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.price)}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: b.payment === 'Đã thanh toán' ? '#059669' : '#D97706' }}>
                      {b.payment}
                    </span>
                  </td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {b.status === 'Chờ xử lý' && (
                        <>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(b.id, 'Đã xác nhận')}>Duyệt</button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(b.id, 'Đã hủy')}>Hủy</button>
                        </>
                      )}
                      <button type="button" className="btn-icon edit" title="Chi tiết"><i className="bi bi-eye"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
