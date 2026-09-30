import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([
    { id: 1, origin: 'Hà Nội', destination: 'Sapa', distance: '320 km', tripCount: 15 },
    { id: 2, origin: 'TP.HCM', destination: 'Đà Lạt', distance: '300 km', tripCount: 22 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await adminService.getRoutes();
      if (res?.data) setRoutes(res.data);
    } catch (error) {
      console.log('Using mock routes data');
    }
  };

  const handleOpenModal = (route = null) => {
    setCurrentRoute(route || { origin: '', destination: '', distance: '', tripCount: 0 });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa tuyến đường này?')) {
      // call api delete
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Tuyến đường</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg"></i> Thêm tuyến
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Điểm đi</th>
              <th>Điểm đến</th>
              <th>Khoảng cách</th>
              <th>Số chuyến</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.origin}</td>
                <td>{r.destination}</td>
                <td>{r.distance}</td>
                <td>{r.tripCount}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(r.id)}><i className="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentRoute.id ? 'Sửa tuyến đường' : 'Thêm tuyến đường'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Điểm đi</label>
                  <input type="text" className="form-control" value={currentRoute.origin} onChange={e => setCurrentRoute({...currentRoute, origin: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Điểm đến</label>
                  <input type="text" className="form-control" value={currentRoute.destination} onChange={e => setCurrentRoute({...currentRoute, destination: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Khoảng cách</label>
                  <input type="text" className="form-control" value={currentRoute.distance} onChange={e => setCurrentRoute({...currentRoute, distance: e.target.value})} required />
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

export default AdminRoutes;
