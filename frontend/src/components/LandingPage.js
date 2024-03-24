import React, { useState } from 'react';
import './styles.css';

const LandingPage = () => {
  const [resetMessage, setResetMessage] = useState(null);
  const [populateMessage, setPopulateMessage] = useState(null);

  // Función para resetear datos
  const handleReset = async () => {
    try {
      const response = await fetch('https://prueba-t1-tdi.onrender.com/reset', {
        method: 'POST',
      }); 
      if (response.ok) {
        setResetMessage('Base de datos borrada');
      } else {
        console.error('Error al resetear la base de datos');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
    }
  };

  // Función para poblar datos
  const handlePopulate = async () => {
    try {
      const response = await fetch('https://prueba-t1-tdi.onrender.com/populate', {
        method: 'POST',
      }); 
      if (response.ok) {
        setPopulateMessage('Base de datos poblada');
      } else {
        console.error('Error al poblar la base de datos');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
    }
  };

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Bienvenido a</h1>
        <div className="image">
          <img src="../integram.png" alt="Integram" />
        </div>
        <div className="button-container">
          <a href="/login" className="btn login-btn">Iniciar Sesión</a>
          <a href="/register" className="btn register-btn">Registrarse</a>
          <button className="btn reset-btn" onClick={handleReset}>Resetear Datos</button>
          {resetMessage && <p>{resetMessage}</p>}
          <button className="btn populate-btn" onClick={handlePopulate}>Poblar Datos</button>
          {populateMessage && <p>{populateMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
