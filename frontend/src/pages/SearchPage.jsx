import { useState } from 'react';
import SearchHeader from '../components/search/SearchHeader';
import FilterSidebar from '../components/search/FilterSidebar';
import TripCard from '../components/search/TripCard';
import '../styles/search.css';

const SearchPage = () => {
  const [filters, setFilters] = useState({
    departurePeriods: [],
    maxPrice: 500000,
    companies: [],
    ratings: []
  });
  const [sortBy, setSortBy] = useState('departure-asc');

  const trips = [
    {
      id: 1,
      company: 'Thành Bưởi',
      busType: 'Limousine 34 giường',
      rating: 4.8,
      reviews: 1250,
      departureTime: '22:00',
      origin: 'Bến xe Miền Đông',
      arrivalTime: '05:00',
      destination: 'Bến xe Đà Lạt',
      duration: '7h 00m',
      seatsAvailable: 15,
      price: '300.000đ'
    },
    {
      id: 2,
      company: 'Phương Trang',
      busType: 'Giường nằm 40 chỗ',
      rating: 4.6,
      reviews: 3420,
      departureTime: '23:00',
      origin: 'Bến xe Miền Đông',
      arrivalTime: '06:30',
      destination: 'Bến xe Đà Lạt',
      duration: '7h 30m',
      seatsAvailable: 5,
      price: '280.000đ'
    },
    {
      id: 3,
      company: 'Limousine Amazing',
      busType: 'Limousine phòng đôi',
      rating: 4.9,
      reviews: 450,
      departureTime: '23:30',
      origin: 'Quận 1, TP.HCM',
      arrivalTime: '06:00',
      destination: 'Trung tâm Đà Lạt',
      duration: '6h 30m',
      seatsAvailable: 8,
      price: '450.000đ'
    }
  ];

  const filteredTrips = trips
    .filter((trip) => {
      const departureHour = Number(trip.departureTime.split(':')[0]);
      const matchesDeparture = filters.departurePeriods.length === 0 || filters.departurePeriods.some((period) => {
        if (period === 'early') return departureHour < 6;
        if (period === 'morning') return departureHour >= 6 && departureHour < 12;
        if (period === 'afternoon') return departureHour >= 12 && departureHour < 18;
        return departureHour >= 18;
      });
      const price = Number(trip.price.replace(/\D/g, ''));
      const matchesCompany = filters.companies.length === 0 || filters.companies.includes(trip.company);
      const matchesRating = filters.ratings.length === 0 || filters.ratings.some((rating) => trip.rating >= rating);

      return matchesDeparture && price <= filters.maxPrice && matchesCompany && matchesRating;
    })
    .sort((firstTrip, secondTrip) => {
      if (sortBy === 'departure-desc') return secondTrip.departureTime.localeCompare(firstTrip.departureTime);
      const firstPrice = Number(firstTrip.price.replace(/\D/g, ''));
      const secondPrice = Number(secondTrip.price.replace(/\D/g, ''));
      if (sortBy === 'price-asc') return firstPrice - secondPrice;
      if (sortBy === 'price-desc') return secondPrice - firstPrice;
      return firstTrip.departureTime.localeCompare(secondTrip.departureTime);
    });

  const updateFilters = (nextFilters) => setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
  const clearFilters = () => setFilters({ departurePeriods: [], maxPrice: 500000, companies: [], ratings: [] });

  return (
    <div className="search-page">
      <SearchHeader />
      
      <div className="container search-layout">
        <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        
        <section className="search-results">
          <div className="trip-list-header">
            <h2>Có {filteredTrips.length} chuyến xe được tìm thấy</h2>
            <select className="sort-dropdown" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sắp xếp chuyến xe">
              <option value="departure-asc">Giờ khởi hành: Sớm nhất</option>
              <option value="departure-desc">Giờ khởi hành: Muộn nhất</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
          
          <div className="trip-list">
            {filteredTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            {filteredTrips.length === 0 && <p className="empty-trips">Không tìm thấy chuyến phù hợp. Hãy thử thay đổi bộ lọc.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SearchPage;
