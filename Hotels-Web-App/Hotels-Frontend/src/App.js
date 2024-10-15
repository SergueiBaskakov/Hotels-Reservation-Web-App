import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './LoginPage';
import AdminPage from './AdminPage';
import UserPage from './UserPage';
import PrivateRoute from './PrivateRoute';
import { jwtDecode } from 'jwt-decode';

import './App.css'; 


const rolesAttributeName = "https://lab5/roles"
//authData[rolesAttributeName].includes('Admin')
const App = () => {
  const [authData, setAuthData] = useState(null);

    // Load authData from localStorage when the app loads
    useEffect(() => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log(storedToken);
        var user = jwtDecode(storedToken);
        setAuthData({storedToken, user});
      }
    }, []);

    // Logout function to clear authData
    const handleLogout = () => {
      setAuthData(null);
      localStorage.removeItem('token');
    };

  return (
    <div className="app-container">
      <div className="header-container">
        <h1 className="title">Hotel App</h1>
        {authData != null ? (
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <div></div>
        )}
      </div>
      {authData == null ? (
        <Login setAuthData={setAuthData} />
      ) : authData.user[rolesAttributeName].includes('Admin') ? (
        <AdminPage />
      ) : (
        <UserPage />
      )}
    </div>
  );
};

export default App;
