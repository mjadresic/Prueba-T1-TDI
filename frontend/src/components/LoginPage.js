import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import './styles.css'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 

    try {
      const response = await fetch('https://tarea-1-mjadresic.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      // Si la respuesta es exitosa, almacenar el usuario en localStorage
      const userData = await response.json();
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Redirigir al usuario a la página de inicio
      navigate('/posts');
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Failed to login. Please check your credentials and try again.');
    }
  };

  return (
    <div className="container">
      <div className="content">
        <img src="../integram.png" alt="Tu Imagen" className="logo" />
        <h1 className="title">Login</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          {error && <p className="error-message">{error}</p>} {/* Mostrar mensaje de error si existe */}
          <div className="button-container">
            <button type="submit" className="btn">Login</button>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
