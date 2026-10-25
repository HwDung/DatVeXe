import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';
//
const DEFAULT_TRIPS = [
  { id: '1', route: 'Hà Nội - Sapa', company: 'Sapa Express', departureTime: '07:00', arrivalTime: '13:00', price: 320000, status: 'Đang mở bán' },
  { id: '2', route: 'TP.HCM - Đà Lạt', company: 'Phương Trang', departureTime: '14:00', arrivalTime: '19:30', price: 280000, status: 'Đang mở bán' },
  { id: '3', route: 'Đà Nẵng - Huế', company: 'Hạnh Cafe', departureTime: '08:00', arrivalTime: '10:30', price: 150000, status: 'Đã đầy' },
  { id: '4', route: 'TP.HCM - Nha Trang', company: 'Phương Trang', departureTime: '06:30', arrivalTime: '15:00', price: 220000, status: 'Đang mở bán' },
];

const AdminTrips = () => {
  const [trips, setTrips] = useState(DEFAULT_TRIPS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importSheetName, setImportSheetName] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [isPreviewingImport, setIsPreviewingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await adminService.getTrips();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setTrips(res.data.map(t => ({
          id: t.id,
          route: t.route ? `${t.route.origin} - ${t.route.destination}` : (t.route || 'Chưa chọn tuyến'),
          company: t.company?.name || t.company || 'Phương Trang',
          departureTime: t.departureTime || '08:00',
          arrivalTime: t.arrivalTime || '14:00',
          price: t.price || 250000,
          status: t.isActive ? 'Đang mở bán' : 'Tạm dừng',
        })));
      }
    } catch {
      // Keep fallback trips
    }
  };

  useEffect(() => {
    let isCurrent = true;
    adminService.getTrips()
      .then((res) => {
        if (isCurrent && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setTrips(res.data.map(t => ({
            id: t.id,
            route: t.route ? `${t.route.origin} - ${t.route.destination}` : (t.route || 'Chưa chọn tuyến'),
            company: t.company?.name || t.company || 'Phương Trang',
            departureTime: t.departureTime || '08:00',
            arrivalTime: t.arrivalTime || '14:00',
            price: t.price || 250000,
            status: t.isActive ? 'Đang mở bán' : 'Tạm dừng',
          })));
        }
      })
      .catch(() => {
        // Keep fallback trips
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleImportFileChange = (event) => {
    setImportFile(event.target.files?.[0] || null);
    setImportPreview(null);
    setImportResult(null);
    setImportError('');
  };

  const handlePreviewImport = async () => {
    if (!importFile) {
      setImportError('Vui lòng chọn file .xlsx trước khi xem trước.');
      return;
    }
    setIsPreviewingImport(true);
    setImportError('');
    setImportResult(null);
    try {
      const response = await adminService.previewTripImport(importFile, importSheetName.trim() || undefined);
      setImportPreview(response.data);
    } catch (error) {
      setImportPreview(null);
      setImportError(error.response?.data?.message || 'Không thể kiểm tra file Excel.');
    } finally {
      setIsPreviewingImport(false);
    }
  };

  const handleImportTrips = async () => {
    if (!importFile || !importPreview) return;
    if (!window.confirm(`Xác nhận import lại file? Hệ thống sẽ kiểm tra lại và chỉ lưu dòng hợp lệ.`)) return;

    setIsImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const response = await adminService.importTrips(importFile, importSheetName.trim() || undefined);
      setImportResult(response.data);
      setImportPreview(null);
      await fetchTrips();
    } catch (error) {
      setImportError(error.response?.data?.message || 'Không thể import file Excel.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenModal = (trip = null) => {
    setCurrentTrip(trip || { route: '', company: '', departureTime: '', arrivalTime: '', price: 0, status: 'Đang mở bán' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentTrip.id && typeof currentTrip.id === 'string' && currentTrip.id.length > 5) {
        await adminService.updateTrip(currentTrip.id, currentTrip);
      } else {
        await adminService.createTrip(currentTrip);
      }
      setIsModalOpen(false);
      fetchTrips();
    } catch {
      // Mock update
      if (currentTrip.id) {
        setTrips(trips.map(t => t.id === currentTrip.id ? currentTrip : t));
      } else {
        setTrips([...trips, { ...currentTrip, id: String(Date.now()) }]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chuyến xe này?')) {
      try {
        await adminService.deleteTrip(id);
        fetchTrips();
      } catch {
        setTrips(trips.filter(t => t.id !== id));
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Quản lý Chuyến xe</h2>
        <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg"></i> Thêm chuyến
        </button>
      </div>

      <section className="admin-table-container" aria-labelledby="trip-import-heading" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 id="trip-import-heading" style={{ marginTop: 0 }}>Import chuyến xe từ Excel</h3>
        <p>Chọn file .xlsx để kiểm tra trước. Preview không lưu dữ liệu; khi xác nhận, hệ thống kiểm tra lại và chỉ import các dòng hợp lệ.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: '12px' }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span>File Excel (.xlsx)</span>
            <input type="file" className="form-control" accept=".xlsx" onChange={handleImportFileChange} />
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span>Tên sheet (không bắt buộc)</span>
            <input
              type="text"
              className="form-control"
              value={importSheetName}
              maxLength={31}
              placeholder="Mặc định: sheet đầu tiên"
              onChange={(event) => {
                setImportSheetName(event.target.value);
                setImportPreview(null);
                setImportResult(null);
              }}
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={handlePreviewImport} disabled={!importFile || isPreviewingImport || isImporting}>
            {isPreviewingImport ? 'Đang kiểm tra...' : 'Xem trước'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleImportTrips} disabled={!importPreview || importPreview.validRows === 0 || isPreviewingImport || isImporting}>
            {isImporting ? 'Đang import...' : 'Xác nhận Import'}
          </button>
        </div>
        {importFile && <p style={{ marginBottom: 0, marginTop: '8px' }}>Đã chọn: {importFile.name}</p>}
        {importError && <div role="alert" className="alert alert-danger" style={{ marginTop: '16px' }}>{importError}</div>}

        {importPreview && (
          <div style={{ marginTop: '16px' }}>
            <strong>Sheet: {importPreview.sheetName}</strong>
            <p role="status">
              Tổng {importPreview.totalRows} dòng — hợp lệ: {importPreview.validRows}, không hợp lệ: {importPreview.invalidRows}
              {importPreview.previewLimit ? ` (hiển thị ${importPreview.preview.length}/${importPreview.totalRows} dòng)` : ''}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead><tr><th>Dòng Excel</th><th>Trạng thái</th><th>Lỗi theo cột</th></tr></thead>
                <tbody>
                  {importPreview.preview.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>{row.status === 'valid' ? 'Hợp lệ' : 'Không hợp lệ'}</td>
                      <td>{row.errors.length
                        ? row.errors.map((error, index) => (
                          <div key={`${error.field}-${index}`}><strong>{error.field}:</strong> {error.message}</div>
                        ))
                        : 'Không có lỗi'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importResult && (
          <div role="status" style={{ marginTop: '16px' }}>
            <strong>Kết quả import — sheet {importResult.sheetName}</strong>
            <p>Tổng {importResult.totalRows} dòng: thành công {importResult.importedRows}, thất bại {importResult.failedRows}.</p>
            {[...importResult.validationFailures, ...importResult.importFailures].length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Dòng Excel</th><th>Loại lỗi</th><th>Chi tiết</th></tr></thead>
                  <tbody>
                    {[...importResult.validationFailures, ...importResult.importFailures].map((failure, index) => (
                      <tr key={`${failure.rowNumber}-${failure.code}-${index}`}>
                        <td>{failure.rowNumber}</td>
                        <td>{failure.code}</td>
                        <td>{failure.message || failure.errors?.map((error) => `${error.field}: ${error.message}`).join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="admin-table-container">
        <div className="admin-filters">
          <input type="text" className="form-control" placeholder="Tìm theo tuyến đường, nhà xe..." style={{ maxWidth: '300px' }} />
          <select className="form-control" style={{ maxWidth: '200px' }}>
            <option value="">Tất cả nhà xe</option>
            <option value="Phương Trang">Phương Trang</option>
            <option value="Thành Bưởi">Thành Bưởi</option>
            <option value="Hạnh Cafe">Hạnh Cafe</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tuyến đường</th>
                <th>Nhà xe</th>
                <th>Giờ đi - Giờ đến</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td><strong>#{trip.id}</strong></td>
                  <td>{trip.route}</td>
                  <td>{trip.company}</td>
                  <td>{trip.departureTime} - {trip.arrivalTime}</td>
                  <td><strong style={{ color: '#DC2626' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}</strong></td>
                  <td>
                    <span className={`badge ${trip.status === 'Đang mở bán' ? 'badge-success' : 'badge-warning'}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="btn-icon edit" onClick={() => handleOpenModal(trip)} title="Sửa"><i className="bi bi-pencil"></i></button>
                      <button type="button" className="btn-icon delete" onClick={() => handleDelete(trip.id)} title="Xóa"><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentTrip?.id ? 'Sửa chuyến xe' : 'Thêm chuyến xe mới'}</h3>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tuyến đường</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentTrip?.route || ''}
                    onChange={e => setCurrentTrip({ ...currentTrip, route: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nhà xe</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentTrip?.company || ''}
                    onChange={e => setCurrentTrip({ ...currentTrip, company: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Giờ khởi hành</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: 08:00"
                      value={currentTrip?.departureTime || ''}
                      onChange={e => setCurrentTrip({ ...currentTrip, departureTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ đến</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: 14:00"
                      value={currentTrip?.arrivalTime || ''}
                      onChange={e => setCurrentTrip({ ...currentTrip, arrivalTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Giá vé (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={currentTrip?.price || 0}
                    onChange={e => setCurrentTrip({ ...currentTrip, price: Number(e.target.value) })}
                    required
                  />
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
