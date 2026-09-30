import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Sao Việt', description: 'Chuyên tuyến Hà Nội - Sapa', rating: 4.5, busCount: 45 },
    { id: 2, name: 'Phương Trang', description: 'Mạng lưới xe khách lớn nhất', rating: 4.8, busCount: 500 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);

  useEffect(() => {
    // fetchCompanies();
  }, []);

  const handleOpenModal = (company = null) => {
    setCurrentCompany(company || { name: '', description: '', rating: 5.0, busCount: 0 });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Nhà xe</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg"></i> Thêm nhà xe
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên nhà xe</th>
              <th>Mô tả</th>
              <th>Đánh giá</th>
              <th>Số xe</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><strong>{c.name}</strong></td>
                <td>{c.description}</td>
                <td>{c.rating} <i className="bi bi-star-fill" style={{color: '#FBBF24'}}></i></td>
                <td>{c.busCount}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(c)}><i className="bi bi-pencil"></i></button>
                    <button className="btn-icon delete"><i className="bi bi-trash"></i></button>
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
              <h3>{currentCompany.id ? 'Sửa nhà xe' : 'Thêm nhà xe'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên nhà xe</label>
                  <input type="text" className="form-control" value={currentCompany.name} onChange={e => setCurrentCompany({...currentCompany, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea className="form-control" rows="3" value={currentCompany.description} onChange={e => setCurrentCompany({...currentCompany, description: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Số lượng xe</label>
                  <input type="number" className="form-control" value={currentCompany.busCount} onChange={e => setCurrentCompany({...currentCompany, busCount: e.target.value})} />
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

export default AdminCompanies;
