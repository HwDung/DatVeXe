import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchForm = () => {
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <form className="search-form" onSubmit={handleSearch}>
      <div className="form-group">
        <i className="bi bi-geo-alt"></i>
        <div style={{width: '100%', position: 'relative'}}>
          <label>Từ</label>
          <input type="text" placeholder="Nhập điểm đi" style={{paddingTop: '16px'}} defaultValue="Hà Nội" />
        </div>
      </div>
      
      <div className="form-group">
        <i className="bi bi-geo-alt-fill"></i>
        <div style={{width: '100%', position: 'relative'}}>
          <label>Đến</label>
          <input type="text" placeholder="Nhập điểm đến ví dụ Đà Nẵng" style={{paddingTop: '16px'}} />
        </div>
      </div>
      
      <div className="form-group">
        <i className="bi bi-calendar-event"></i>
        <div style={{width: '100%', position: 'relative'}}>
          <label>Ngày đi</label>
          <input type="text" placeholder="25/09/2025" style={{paddingTop: '16px'}} defaultValue="25/09/2025" />
        </div>
      </div>
      
      <div className="form-group">
        <i className="bi bi-person"></i>
        <div style={{width: '100%', position: 'relative'}}>
          <label>Số hành khách</label>
          <select style={{paddingTop: '16px'}}>
            <option value="1">1 người</option>
            <option value="2">2 người</option>
            <option value="3">3 người</option>
            <option value="4">4 người</option>
          </select>
        </div>
      </div>
      
      <button type="submit" className="btn-primary search-btn" style={{display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'}}>
        <i className="bi bi-search"></i> Tìm chuyến xe
      </button>
    </form>
  );
};

export default SearchForm;
