import React, { useState } from 'react';

const AdminUsers = () => {
  const [users, setUsers] = useState([
    { id: 1, email: 'admin@rightway.vn', name: 'Quản trị viên', role: 'Admin', created: '2023-01-01', status: 'Hoạt động' },
    { id: 2, email: 'nguyenvana@gmail.com', name: 'Nguyễn Văn A', role: 'User', created: '2023-10-15', status: 'Hoạt động' },
    { id: 3, email: 'spam@gmail.com', name: 'Spammer', role: 'User', created: '2023-11-20', status: 'Đã khóa' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleOpenModal = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Người dùng</h2>
      </div>

      <div className="admin-table-container">
        <div className="admin-filters">
          <input type="text" className="form-control" placeholder="Tìm kiếm email, họ tên..." style={{ maxWidth: '300px' }} />
          <select className="form-control" style={{ maxWidth: '200px' }}>
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === 'Admin' ? 'badge-info' : 'badge-secondary'}`}>{u.role}</span></td>
                <td>{u.created}</td>
                <td><span className={`badge ${u.status === 'Hoạt động' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(u)}><i className="bi bi-pencil"></i></button>
                    {u.role !== 'Admin' && <button className="btn-icon delete"><i className="bi bi-lock"></i></button>}
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
              <h3>Chỉnh sửa Người dùng</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Họ tên</label>
                  <input type="text" className="form-control" value={currentUser.name} disabled />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={currentUser.email} disabled />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select className="form-control" value={currentUser.role} onChange={e => setCurrentUser({...currentUser, role: e.target.value})}>
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select className="form-control" value={currentUser.status} onChange={e => setCurrentUser({...currentUser, status: e.target.value})}>
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Đã khóa">Đã khóa</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
