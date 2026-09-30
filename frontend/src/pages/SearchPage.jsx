import React from 'react';
import SearchHeader from '../components/search/SearchHeader';
import FilterSidebar from '../components/search/FilterSidebar';
import TripCard from '../components/search/TripCard';
import '../styles/search.css';

const SearchPage = () => {
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

  return (
    <div className="search-page">
      <SearchHeader />
      
      <div className="container search-layout">
        <FilterSidebar />
        
        <div>
          <div className="trip-list-header">
            <h2>Có {trips.length} chuyến xe được tìm thấy</h2>
            <select className="sort-dropdown">
              <option>Sắp xếp: Giờ khởi hành (Sớm nhất)</option>
              <option>Sắp xếp: Giờ khởi hành (Muộn nhất)</option>
              <option>Sắp xếp: Giá (Thấp đến cao)</option>
              <option>Sắp xếp: Giá (Cao đến thấp)</option>
            </select>
          </div>
          
          <div className="trip-list">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
