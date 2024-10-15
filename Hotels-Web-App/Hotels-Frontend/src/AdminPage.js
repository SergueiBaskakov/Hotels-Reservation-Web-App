// AdminPage.js
import React, { useState, useEffect } from 'react';
import './AdminPage.css'; 


const adminBaseURL = "http://localhost";

const AdminPage = () => {
  const [statistics, setStatistics] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token'); 

  useEffect(() => {
    const fetchStatistics = async () => {
      console.log("Token: ");
      console.log(token);
      try {
        const response = await fetch(`${adminBaseURL}/api/v1/statistics`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,  // Pass the token in the Authorization header
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',  // Add Cache-Control header
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        setStatistics(data);  // Set the API response data to the state
      } catch (err) {
        setError(err.message);  // Set the error message if something goes wrong
      }
    };

    if (token) {
      fetchStatistics();  // Only call the API if the token exists
    } else {
      setError('Token not found. Please log in.');
    }
  }, [token]);


  return (
    <div className="admin-container">
      <h1 className="admin-title">Reservation Statistics</h1>

      {error && <p className="error-message">{error}</p>}  {/* Display any errors */}
      
      {statistics.length > 0 ? (
        <ul className="statistics-list">
          {statistics.map((stat) => (
            <li key={stat.name} className="statistics-item">
              <strong>{stat.name}</strong> {stat.number}
            </li>
          ))}
        </ul>
      ) : (
        <p className="loading-message">Loading statistics...</p>
      )}
    </div>
  );
};
  
export default AdminPage;
  