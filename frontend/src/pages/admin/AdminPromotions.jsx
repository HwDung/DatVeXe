import React, { useState } from 'react';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([
    { id: 1, title: 'Giảm 20% cho thành viên mới', code: 'NEW20', discount: 20, startDate: '2023-11-01', endDate: '2023-12-31', status: 'Đang diễn ra' },
    { id: 2, title: 'Tết Dương Lịch 2024', code: 'TET2024', discount: 15, startDate: '2023-12-25', endDate: '2024-01-05', status: 'Sắp tới' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);

  const handleOpenModal = (promo = null) => {
    setCurrentPromo(promo || { title: '', code: '', discount: 0, startDate: '', endDate: '', status: 'Đang diễn ra' });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Khuyến mãi</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg"></i> Thêm khuyến mãi
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên chương trình</th>
              <th>Mã Code</th>
              <th>Giảm giá (%)</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><strong>{p.title}</strong></td>
                <td><span style={{background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', border: '1px dashed #D1D5DB'}}>{p.code}</span></td>
                <td>{p.discount}%</td>
                <td>{p.startDate} - {p.endDate}</td>
                <td><span className={`badge ${p.status === 'Đang diễn ra' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(p)}><i className="bi bi-pencil"></i></button>
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
              <h3>{currentPromo.id ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên chương trình</label>
                  <input type="text" className="form-control" value={currentPromo.title} onChange={e => setCurrentPromo({...currentPromo, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Mã Code</label>
                  <input type="text" className="form-control" value={currentPromo.code} onChange={e => setCurrentPromo({...currentPromo, code: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Giảm giá (%)</label>
                  <input type="number" className="form-control" value={currentPromo.discount} onChange={e => setCurrentPromo({...currentPromo, discount: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Ngày bắt đầu</label>
                    <input type="date" className="form-control" value={currentPromo.startDate} onChange={e => setCurrentPromo({...currentPromo, startDate: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Ngày kết thúc</label>
                    <input type="date" className="form-control" value={currentPromo.endDate} onChange={e => setCurrentPromo({...currentPromo, endDate: e.target.value})} required />
                  </div>
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

export default AdminPromotions;
