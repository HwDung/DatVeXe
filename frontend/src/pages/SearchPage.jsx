import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchHeader from '../components/search/SearchHeader';
import FilterSidebar from '../components/search/FilterSidebar';
import TripCard from '../components/search/TripCard';
import { tripService } from '../services/api';
import '../styles/search.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.toString();
  const [trips, setTrips] = useState([]);
  const [resultStatus, setResultStatus] = useState({ key: '', loading: true, error: '' });
  const [filters, setFilters] = useState({
    departurePeriods: [],
    maxPrice: 500000,
    companies: [],
    ratings: []
  });
  const [sortBy, setSortBy] = useState('departure-asc');
  const requestKey = JSON.stringify({ searchQuery, filters, sortBy });

  useEffect(() => {
    let isCurrentRequest = true;
    const params = Object.fromEntries(new URLSearchParams(searchQuery).entries());
    delete params.passengers;
    params.maxPrice = filters.maxPrice;
    params.sort = sortBy.replace('-', '_');
    if (filters.departurePeriods.length) params.departurePeriods = filters.departurePeriods.join(',');
    else delete params.departurePeriods;
    if (filters.companies.length) params.companies = filters.companies.join(',');
    else delete params.companies;
    if (filters.ratings.length) params.rating = Math.min(...filters.ratings);
    else delete params.rating;

    tripService.search(params)
      .then(({ data }) => {
        if (!isCurrentRequest) return;
        setTrips(data.map((trip) => ({
          id: trip.id,
          company: trip.company?.name || 'Nhà xe',
          busType: trip.bus?.type || 'Thông tin xe chưa cập nhật',
          rating: trip.company?.rating ?? 0,
          reviews: trip.company?.totalReviews ?? 0,
          departureTime: trip.departureTime,
          origin: trip.route?.origin || '',
          arrivalTime: trip.arrivalTime,
          destination: trip.route?.destination || '',
          duration: trip.duration,
          seatsAvailable: null,
          price: `${Number(trip.price).toLocaleString('vi-VN')}đ`,
        })));
        setResultStatus({ key: requestKey, loading: false, error: '' });
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return;
        setTrips([]);
        setResultStatus({
          key: requestKey,
          loading: false,
          error: requestError.response?.data?.message || 'Không thể tải danh sách chuyến. Vui lòng thử lại.',
        });
      })
      ;

    return () => {
      isCurrentRequest = false;
    };
  }, [requestKey, searchQuery, filters.companies, filters.departurePeriods, filters.maxPrice, filters.ratings, sortBy]);

  const isLoading = resultStatus.key !== requestKey || resultStatus.loading;
  const error = resultStatus.key === requestKey ? resultStatus.error : '';

  const updateFilters = (nextFilters) => setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
  const clearFilters = () => setFilters({ departurePeriods: [], maxPrice: 500000, companies: [], ratings: [] });

  return (
    <div className="search-page">
      <SearchHeader passengers={searchParams.get('passengers') || '1'} searchParams={searchParams} />
      
      <div className="container search-layout">
        <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        
        <section className="search-results">
          <div className="trip-list-header">
            <h2>{isLoading ? 'Đang tìm chuyến xe...' : `Có ${trips.length} chuyến xe được tìm thấy`}</h2>
            <select className="sort-dropdown" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sắp xếp chuyến xe">
              <option value="departure-asc">Giờ khởi hành: Sớm nhất</option>
              <option value="departure-desc">Giờ khởi hành: Muộn nhất</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
          
          <div className="trip-list">
            {error && <p className="empty-trips" role="alert">{error}</p>}
            {!isLoading && !error && trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            {!isLoading && !error && trips.length === 0 && <p className="empty-trips">Không tìm thấy chuyến phù hợp. Hãy thử thay đổi bộ lọc.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SearchPage;
