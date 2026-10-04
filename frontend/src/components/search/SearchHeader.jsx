const SearchHeader = ({ passengers, searchParams }) => {
  const origin = searchParams.get('origin') || 'Tất cả điểm đi';
  const destination = searchParams.get('destination') || 'Tất cả điểm đến';
  const date = searchParams.get('date');
  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')
    : 'Mọi ngày';

  return (
    <div className="search-header-bar">
      <div className="container search-header-content">
        <div className="route-info">
          <h1>{origin} <i className="bi bi-arrow-right" style={{fontSize: '16px'}}></i> {destination}</h1>
          <div className="route-meta">
            <span><i className="bi bi-calendar-event"></i> {formattedDate}</span>
            <span><i className="bi bi-person"></i> {passengers} hành khách</span>
          </div>
        </div>
        <button className="btn-outline">Thay đổi</button>
      </div>
    </div>
  );
};

export default SearchHeader;
