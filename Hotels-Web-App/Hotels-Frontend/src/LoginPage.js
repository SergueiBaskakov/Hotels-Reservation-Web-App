import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './LoginPage.css'; 


const Login = ({ setAuthData }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loader state

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
    console.log("Start login");
    try {
      const response = await axios.post('https://dev-8ntxzeiwzktxlcmw.us.auth0.com/oauth/token', {
        scope: "openid",
        grant_type: "password",
        username: email,
        password: password,
        client_id: "g2rbN7TMJsV0fQPSFUay7uZ3sz6as71w",
        client_secret: "TvZbOWFDB0yw8QwAUA48m3XVyfqX3dTBAxEUjuVL0aXn4rjTvagM3KngbHJoKm02",
      });
      const token = response.data.access_token;
      const user = jwtDecode(token); // Assumes JWT token
      localStorage.setItem('token', token);
      setAuthData({ token, user });
      setError('Login succeeded');
    } catch (err) {
      console.log("error:");
      console.log(err);
      setError('Login failed');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="login-input"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="login-input"
      />
      <button type="submit" className="login-button" disabled={loading}>
        {loading ? 'Loading...' : 'Login'} {/* Show loading text */}
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default Login;