import React, { useState } from 'react';

const AdminNews = () => {
  const [news, setNews] = useState([
    { id: 1, title: 'Khai trương tuyến mới Hà Nội - Mộc Châu', category: 'Tin tức', published: '2023-11-15', status: 'Đã xuất bản' },
    { id: 2, title: 'Hướng dẫn đặt vé xe qua ứng dụng Rightway', category: 'Cẩm nang', published: '2023-11-10', status: 'Bản nháp' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState(null);

  const handleOpenModal = (item = null) => {
    setCurrentNews(item || { title: '', category: 'Tin tức', content: '', status: 'Bản nháp' });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Tin tức</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg"></i> Thêm bài viết
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>Danh mục</th>
              <th>Ngày đăng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {news.map(n => (
              <tr key={n.id}>
                <td>{n.id}</td>
                <td><strong>{n.title}</strong></td>
                <td>{n.category}</td>
                <td>{n.published || '---'}</td>
                <td><span className={`badge ${n.status === 'Đã xuất bản' ? 'badge-success' : 'badge-secondary'}`}>{n.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(n)}><i className="bi bi-pencil"></i></button>
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
          <div className="modal-content" style={{maxWidth: '800px'}}>
            <div className="modal-header">
              <h3>{currentNews.id ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tiêu đề</label>
                  <input type="text" className="form-control" value={currentNews.title} onChange={e => setCurrentNews({...currentNews, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
                  <select className="form-control" value={currentNews.category} onChange={e => setCurrentNews({...currentNews, category: e.target.value})}>
                    <option value="Tin tức">Tin tức</option>
                    <option value="Cẩm nang">Cẩm nang</option>
                    <option value="Thông báo">Thông báo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nội dung</label>
                  <textarea className="form-control" rows="10" placeholder="Soạn thảo nội dung..." value={currentNews.content || ''} onChange={e => setCurrentNews({...currentNews, content: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select className="form-control" value={currentNews.status} onChange={e => setCurrentNews({...currentNews, status: e.target.value})}>
                    <option value="Bản nháp">Bản nháp</option>
                    <option value="Đã xuất bản">Đã xuất bản</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu bài viết</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
