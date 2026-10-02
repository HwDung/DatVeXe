import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminApi';

const DEFAULT_STATS = {
  totalBookings: 1250,
  revenue: 450000000,
  users: 850,
  trips: 120,
};

const DEFAULT_BOOKINGS = [
  { id: 'RW2601', passenger: 'Nguyễn Văn A', route: 'Hà Nội - Sapa', date: '25/09/2025', price: 320000, status: 'Đã xác nhận' },
  { id: 'RW2602', passenger: 'Trần Thị B', route: 'TP.HCM - Đà Lạt', date: '25/09/2025', price: 280000, status: 'Chờ xử lý' },
  { id: 'RW2603', passenger: 'Lê Văn C', route: 'Đà Nẵng - Huế', date: '26/09/2025', price: 150000, status: 'Đã hủy' },
  { id: 'RW2604', passenger: 'Phạm Minh D', route: 'TP.HCM - Nha Trang', date: '27/09/2025', price: 220000, status: 'Đã xác nhận' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentBookings, setRecentBookings] = useState(DEFAULT_BOOKINGS);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const response = await adminService.getDashboard();
        if (!isMounted || !response?.data) return;

        const data = response.data;
        setStats({
          totalBookings: data.totalBookings ?? data.stats?.totalBookings ?? DEFAULT_STATS.totalBookings,
          revenue: data.revenue ?? data.stats?.revenue ?? DEFAULT_STATS.revenue,
          users: data.totalUsers ?? data.users ?? data.stats?.users ?? DEFAULT_STATS.users,
          trips: data.totalTrips ?? data.trips ?? data.stats?.trips ?? DEFAULT_STATS.trips,
        });

        if (Array.isArray(data.recentBookings) && data.recentBookings.length > 0) {
          setRecentBookings(
            data.recentBookings.map((b) => {
              const origin = b.trip?.route?.origin || '';
              const destination = b.trip?.route?.destination || '';
              const routeName = origin && destination ? `${origin} - ${destination}` : (b.route || 'Hà Nội - Đà Nẵng');
              const tripDateStr = b.tripDate ? new Date(b.tripDate).toLocaleDateString('vi-VN') : (b.date || '25/09/2025');

              let statusLabel = 'Chờ xử lý';
              const rawStatus = String(b.status || '').toLowerCase();
              if (rawStatus === 'confirmed' || rawStatus.includes('xác nhận')) statusLabel = 'Đã xác nhận';
              else if (rawStatus === 'cancelled' || rawStatus.includes('hủy')) statusLabel = 'Đã hủy';

              return {
                id: b.bookingCode || b.id || 'RW0000',
                passenger: b.passengerName || b.passenger || 'Khách hàng',
                route: routeName,
                date: tripDateStr,
                price: Number(b.totalPrice ?? b.price ?? 0),
                status: statusLabel,
              };
            })
          );
        }
      } catch (error) {
        console.error('Error fetching dashboard data, fallback to mock data:', error);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('xác nhận') || s === 'confirmed') return <span className="badge badge-success">Đã xác nhận</span>;
    if (s.includes('chờ') || s === 'pending') return <span className="badge badge-warning">Chờ xử lý</span>;
    if (s.includes('hủy') || s === 'cancelled') return <span className="badge badge-danger">Đã hủy</span>;
    return <span className="badge badge-info">{status || 'Chờ xử lý'}</span>;
  };

  return (
    <div>
      {/* Stat Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="bi bi-ticket-detailed"></i></div>
          <div className="stat-info">
            <h3>Tổng đặt vé</h3>
            <p>{(stats?.totalBookings ?? 0).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green"><i className="bi bi-currency-dollar"></i></div>
          <div className="stat-info">
            <h3>Doanh thu</h3>
            <p>{formatCurrency(stats?.revenue ?? 0)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple"><i className="bi bi-people"></i></div>
          <div className="stat-info">
            <h3>Người dùng</h3>
            <p>{(stats?.users ?? 0).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orange"><i className="bi bi-bus-front"></i></div>
          <div className="stat-info">
            <h3>Chuyến xe</h3>
            <p>{(stats?.trips ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="chart-card">
        <div style={{ textAlign: 'center' }}>
          <i className="bi bi-bar-chart" style={{ fontSize: '48px', color: '#D1D5DB' }}></i>
          <p style={{ marginTop: '12px', fontWeight: 500 }}>Biểu đồ doanh thu (Hệ thống đang đồng bộ)</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="admin-table-container">
        <div className="admin-table-header">
          <h2>Đặt vé gần đây</h2>
          <span className="badge badge-info">{recentBookings.length} đơn</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Hành khách</th>
                <th>Tuyến đường</th>
                <th>Ngày đi</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td><strong>{booking.id}</strong></td>
                  <td>{booking.passenger}</td>
                  <td>{booking.route}</td>
                  <td>{booking.date}</td>
                  <td><strong style={{ color: '#DC2626' }}>{formatCurrency(booking.price)}</strong></td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    <div className="action-buttons">
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

export default AdminDashboard;
