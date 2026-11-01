import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { routeService } from '../../services/api';

export default function PopularRoutes() {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    routeService.getPopular().then(({ data }) => { if (active) setRoutes(data); })
      .catch(() => { if (active) setError('Chưa tải được tuyến xe. Vui lòng thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <section className="popular-routes">
    <div className="section-header"><h2>Tuyến xe phổ biến</h2><Link to="/search" className="view-all">Xem tất cả tuyến xe <i className="bi bi-arrow-right" /></Link></div>
    {loading && <p role="status">Đang tải tuyến xe...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !routes.length && <p>Chưa có tuyến đang mở bán.</p>}
    <div className="routes-table-container"><table className="routes-table">
      <thead><tr><th>Tuyến đường</th><th>Giờ khởi hành</th><th>Giá vé từ</th><th>Nhà xe</th><th>Thao tác</th></tr></thead>
      <tbody>{routes.map(route => <tr key={route.id}>
        <td><span className="route-name">{route.origin} → {route.destination}</span>{route.isDemo && <small style={{display:'block'}}>Lịch và giá demo</small>}</td>
        <td>{[...new Set(route.departureTimes || [])].join(' · ')}</td>
        <td><span className="route-price">{Number(route.minPrice).toLocaleString('vi-VN')}đ</span></td>
        <td>{route.companies?.join(', ') || route.topCompany}</td>
        <td><Link className="btn-primary" style={{padding:'6px 16px',borderRadius:4}} to={'/search?' + new URLSearchParams({origin:route.origin,destination:route.destination})}>Tìm vé</Link></td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
