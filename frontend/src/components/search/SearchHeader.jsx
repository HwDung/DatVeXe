import React from 'react';

const SearchHeader = () => {
  return (
    <div className="search-header-bar">
      <div className="container search-header-content">
        <div className="route-info">
          <h1>TP. Hồ Chí Minh <i className="bi bi-arrow-right" style={{fontSize: '16px'}}></i> Đà Lạt</h1>
          <div className="route-meta">
            <span><i className="bi bi-calendar-event"></i> Hôm nay</span>
            <span><i className="bi bi-person"></i> 1 Hành khách</span>
          </div>
        </div>
        <button className="btn-outline">Thay đổi</button>
      </div>
    </div>
  );
};

export default SearchHeader;
