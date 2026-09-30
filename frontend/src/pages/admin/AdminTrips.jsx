import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const AdminTrips = () => {
  const [trips, setTrips] = useState([
    { id: 1, route: 'Hà Nội - Sapa', company: 'Sao Việt', departureTime: '2023-12-01 22:00', arrivalTime: '2023-12-02 04:00', price: 350000, status: 'Đang mở bán' },
    { id: 2, route: 'TP.HCM - Đà Lạt', company: 'Phương Trang', departureTime: '2023-12-02 23:00', arrivalTime: '2023-12-03 06:00', price: 250000, status: 'Đã đầy' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  
  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await adminService.getTrips();
      if (res?.data) setTrips(res.data);
    } catch (error) {
      console.log('Using mock trips data');
    }
  };

  const handleOpenModal = (trip = null) => {
    setCurrentTrip(trip || { route: '', company: '', departureTime: '', arrivalTime: '', price: 0, status: 'Đang mở bán' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentTrip.id) {
        await adminService.updateTrip(currentTrip.id, currentTrip);
      } else {
        await adminService.createTrip(currentTrip);
      }
      setIsModalOpen(false);
      fetchTrips(); // Refresh
    } catch (error) {
      console.error('Error saving trip', error);
      setIsModalOpen(false); // Close anyway for mock flow
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chuyến xe này?')) {
      try {
        await adminService.deleteTrip(id);
        fetchTrips();
      } catch (error) {
        console.error('Error deleting trip', error);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý chuyến xe</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg"></i> Thêm chuyến
        </button>
      </div>

      <div className="admin-table-container">
        <div className="admin-filters">
          <input type="text" className="form-control" placeholder="Tìm kiếm chuyến xe..." style={{ maxWidth: '300px' }} />
          <select className="form-control" style={{ maxWidth: '200px' }}>
            <option value="">Tất cả tuyến đường</option>
            <option value="HN-SP">Hà Nội - Sapa</option>
          </select>
          <select className="form-control" style={{ maxWidth: '200px' }}>
            <option value="">Tất cả nhà xe</option>
            <option value="SV">Sao Việt</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tuyến đường</th>
                <th>Nhà xe</th>
                <th>Giờ đi</th>
                <th>Giờ đến</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id}>
                  <td>{trip.id}</td>
                  <td>{trip.route}</td>
                  <td>{trip.company}</td>
                  <td>{trip.departureTime}</td>
                  <td>{trip.arrivalTime}</td>
                  <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}</td>
                  <td>
                    <span className={`badge ${trip.status === 'Đang mở bán' ? 'badge-success' : 'badge-warning'}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => handleOpenModal(trip)}><i className="bi bi-pencil"></i></button>
                      <button className="btn-icon delete" onClick={() => handleDelete(trip.id)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentTrip.id ? 'Sửa chuyến xe' : 'Thêm chuyến xe mới'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tuyến đường</label>
                  <input type="text" className="form-control" value={currentTrip.route} onChange={e => setCurrentTrip({...currentTrip, route: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Nhà xe</label>
                  <input type="text" className="form-control" value={currentTrip.company} onChange={e => setCurrentTrip({...currentTrip, company: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Giờ đi</label>
                  <input type="datetime-local" className="form-control" value={currentTrip.departureTime} onChange={e => setCurrentTrip({...currentTrip, departureTime: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Giờ đến</label>
                  <input type="datetime-local" className="form-control" value={currentTrip.arrivalTime} onChange={e => setCurrentTrip({...currentTrip, arrivalTime: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Giá vé</label>
                  <input type="number" className="form-control" value={currentTrip.price} onChange={e => setCurrentTrip({...currentTrip, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select className="form-control" value={currentTrip.status} onChange={e => setCurrentTrip({...currentTrip, status: e.target.value})}>
                    <option value="Đang mở bán">Đang mở bán</option>
                    <option value="Đã đầy">Đã đầy</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrips;
