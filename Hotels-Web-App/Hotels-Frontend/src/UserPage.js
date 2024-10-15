// UserPage.js
import React, { useState, useEffect } from 'react';

import './UserPage.css';
import { jwtDecode } from 'jwt-decode';

const userBaseURL = "http://localhost";

const UserPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token'); // Get the token from localStorage or other storage

  const decodedToken = jwtDecode(token);
  const userName = decodedToken["https://lab5/name"]
  
  const fetchReservations = async () => {
    try {
      const response = await fetch(`${userBaseURL}/api/v1/reservations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
  
      // Sort the reservations by start date
      const sortedReservations = data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
      setReservations(sortedReservations);
    } catch (err) {
      setError(err.message);
    }
  };
  
  useEffect(() => {
    // 1. Fetch the list of hotels
    const fetchHotels = async () => {
      try {
        const response = await fetch(`${userBaseURL}/api/v1/hotels?page=1&size=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setHotels(data.items);
      } catch (err) {
        setError(err.message);
      }
    };

    // 2. Fetch loyalty program information
    const fetchLoyaltyInfo = async () => {
      try {
        const response = await fetch(`${userBaseURL}/api/v1/loyalty`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setLoyaltyInfo(data);
      } catch (err) {
        setError(err.message);
      }
    };

    // 3. Fetch the list of reservations
    const fetchReservations = async () => {
      try {
        const response = await fetch(`${userBaseURL}/api/v1/reservations`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
    
        // Sort the reservations by start date
        const sortedReservations = data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
        setReservations(sortedReservations);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHotels();
    fetchLoyaltyInfo();
    fetchReservations();
  }, [token]);

  // 4. Make a reservation
  const makeReservation = async (hotelUid, startDate, endDate) => {

    try {
      console.log(JSON.stringify({ "hotelUid" : hotelUid, "startDate": startDate, "endDate": endDate }));
      const response = await fetch(`${userBaseURL}/api/v1/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "hotelUid" : hotelUid, "startDate": startDate, "endDate": endDate }),
      });
      const data = await response.json();
      fetchReservations();
      //setReservations([...reservations, data]); // Add the new reservation to the list
    } catch (err) {
      setError(err.message);
    }
  };

  // 5. Cancel a reservation
  const cancelReservation = async (reservationUid) => {

    try {
      await fetch(`${userBaseURL}/api/v1/reservations/${reservationUid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      fetchReservations();
      //setReservations(reservations.filter(res => res.reservationUid !== reservationUid)); // Remove canceled reservation
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="user-container">
  <h1 className="user-title">Welcome, {userName}!</h1>

  {error && <p className="error-message">{error}</p>}

  {/* Input fields for start and end date */}
  <div className="date-input-container">
    <label className="date-label">
      Start Date:
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
        className="date-input"
      />
    </label>
    <label className="date-label">
      End Date:
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        required
        className="date-input"
      />
    </label>
  </div>

  {/* Display hotels */}
  <h2 className="section-title">Hotels</h2>
  {hotels.length > 0 ? (
    <div className="hotel-container">
      <div className="hotel-header">
        <div className="hotel-column">Name</div>
        <div className="hotel-column">City</div>
        <div className="hotel-column">Country</div>
        <div className="hotel-column">Price (RUB)</div>
        <div className="hotel-column">Action</div>
      </div>
      {hotels.map(hotel => (
        <div key={hotel.id} className="hotel-item">
          <div className="hotel-column">{hotel.name}</div>
          <div className="hotel-column">{hotel.city}</div>
          <div className="hotel-column">{hotel.country}</div>
          <div className="hotel-column">{hotel.price}</div>
          <div className="hotel-column">
            <button 
              className="reservation-button"
              onClick={() => makeReservation(hotel.hotelUid, startDate, endDate)}>
              Make Reservation
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p>No hotels available.</p>
  )}

  {/* Display loyalty information */}
  {loyaltyInfo && (
    <div className="loyalty-info">
      <h2 className="section-title">Loyalty Program</h2>
      <p>Status: {loyaltyInfo.status}</p>
      <p>Reservation Count: {loyaltyInfo.reservationCount}</p>
      <p>Discount: {loyaltyInfo.discount}%</p>
    </div>
  )}

  {/* Display reservations */}
  <h2 className="section-title">Reservations</h2>
  {reservations.length > 0 ? (
    <div className="reservation-container">
      <div className="reservation-header">
        <div className="reservation-column">Hotel</div>
        <div className="reservation-column">Address</div>
        <div className="reservation-column">Start Date</div>
        <div className="reservation-column">End Date</div>
        <div className="reservation-column">Status</div>
        <div className="reservation-column">Action</div>
      </div>
      {reservations.map(res => (
        <div key={res.reservationUid} className="reservation-item">
          <div className="reservation-column">{res.hotel.name}</div>
          <div className="reservation-column">{res.hotel.fullAddress}</div>
          <div className="reservation-column">{res.startDate}</div>
          <div className="reservation-column">{res.endDate}</div>
          <div className="reservation-column">{res.status}</div>
          <div className="reservation-column">
            <button 
              className="cancel-button"
              onClick={() => cancelReservation(res.reservationUid)}>
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p>No reservations found.</p>
  )}
</div>

  );
};

export default UserPage;
  