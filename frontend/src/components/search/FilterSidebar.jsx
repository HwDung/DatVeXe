import React from 'react';

const FilterSidebar = () => {
  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h2>Bộ lọc tìm kiếm</h2>
        <button className="clear-filter">Xoá lọc</button>
      </div>
      
      <div className="filter-group">
        <h3>Giờ khởi hành</h3>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Sáng sớm 00:00 - 06:00</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Sáng 06:00 - 12:00</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Chiều 12:00 - 18:00</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Tối 18:00 - 24:00</span>
          </label>
        </div>
      </div>
      
      <div className="filter-group">
        <h3>Khoảng giá</h3>
        <div className="range-slider">
          <input type="range" min="200000" max="500000" style={{width: '100%', accentColor: 'var(--primary)'}} defaultValue="500000" />
          <div className="range-values">
            <span>200.000đ</span>
            <span>500.000đ</span>
          </div>
        </div>
      </div>
      
      <div className="filter-group">
        <h3>Nhà xe</h3>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Phương Trang</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Thành Bưởi</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Hạnh Cafe</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Thaco</span>
          </label>
        </div>
      </div>
      
      <div className="filter-group">
        <h3>Đánh giá</h3>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" />
            <span style={{color: '#F59E0B'}}>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <span style={{color: 'var(--text)'}}> (từ 5 sao)</span>
            </span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span style={{color: '#F59E0B'}}>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star"></i>
              <span style={{color: 'var(--text)'}}> (từ 4 sao)</span>
            </span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span style={{color: '#F59E0B'}}>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star"></i>
              <i className="bi bi-star"></i>
              <span style={{color: 'var(--text)'}}> (từ 3 sao)</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
