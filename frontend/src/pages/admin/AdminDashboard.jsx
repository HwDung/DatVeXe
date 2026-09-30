import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 1250,
    revenue: 450000000,
    users: 850,
    trips: 120
  });

  const [recentBookings, setRecentBookings] = useState([
    { id: 'BK1001', passenger: 'Nguyễn Văn A', route: 'Hà Nội - Sapa', date: '2023-11-20', price: 350000, status: 'Đã xác nhận' },
    { id: 'BK1002', passenger: 'Trần Thị B', route: 'TP.HCM - Đà Lạt', date: '2023-11-21', price: 250000, status: 'Chờ xử lý' },
    { id: 'BK1003', passenger: 'Lê Văn C', route: 'Đà Nẵng - Huế', date: '2023-11-22', price: 150000, status: 'Đã hủy' }
  ]);

  useEffect(() => {
    // Attempt to fetch real data, fallback to mock data on fail
    const fetchDashboardData = async () => {
      try {
        const response = await adminService.getDashboard();
        if (response?.data) {
          setStats(response.data.stats);
          setRecentBookings(response.data.recentBookings);
        }
      } catch (error) {
        console.error('Error fetching dashboard data, using mock data', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Đã xác nhận': return <span className="badge badge-success">{status}</span>;
      case 'Chờ xử lý': return <span className="badge badge-warning">{status}</span>;
      case 'Đã hủy': return <span className="badge badge-danger">{status}</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div>
      {/* Stat Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="bi bi-ticket-detailed"></i></div>
          <div className="stat-info">
            <h3>Tổng đặt vé</h3>
            <p>{stats.totalBookings.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green"><i className="bi bi-currency-dollar"></i></div>
          <div className="stat-info">
            <h3>Doanh thu</h3>
            <p>{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple"><i className="bi bi-people"></i></div>
          <div className="stat-info">
            <h3>Người dùng</h3>
            <p>{stats.users.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orange"><i className="bi bi-bus-front"></i></div>
          <div className="stat-info">
            <h3>Chuyến xe</h3>
            <p>{stats.trips.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="chart-card">
        <div style={{ textAlign: 'center' }}>
          <i className="bi bi-bar-chart" style={{ fontSize: '48px', color: '#D1D5DB' }}></i>
          <p>Biểu đồ doanh thu (Đang cập nhật)</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="admin-table-container">
        <div className="admin-table-header">
          <h2>Đặt vé gần đây</h2>
          <button className="btn btn-secondary btn-sm">Xem tất cả</button>
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
                  <td>{formatCurrency(booking.price)}</td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" title="Chi tiết"><i className="bi bi-eye"></i></button>
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
