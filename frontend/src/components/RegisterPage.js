import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleRegister = async (e) => {
    e.preventDefault(); 

    try {
      const response = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, avatar }),
      });

      if (!response.ok) {
        throw new Error('Failed to register');
      }

      // Registro exitoso, redirigir al usuario a la página de inicio de sesión
      navigate('/login');
    } catch (error) {
      console.error('Error registering:', error);
      setError('Failed to register. Please check your inputs and try again.');
    }
  };

  return (
    <div className="container">
      <div className="image">
        <img src="../integram.png" alt="Integram" />
      </div>
      <h1>Register</h1>
      {error && <p className="error-message">{error}</p>} {/* Mostrar mensaje de error si existe */}
      <form onSubmit={handleRegister} className="form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Avatar URL"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="input"
          />
        </div>
        <div className="button-container">
          <button type="submit" className="btn">Register</button>
        </div>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

export default RegisterPage;