// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom'
import { LoginPage } from './pages/GetQrPage'
import { RegisterPage } from './pages/RegisterPage'
import { useEffect } from 'react';

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <h1>ABC-QRAS - My Student QR App</h1>
      <h2>Welcome!</h2>
      <div id='button-container'>
        <button
          onClick={() => navigate('/register')}
        >Register</button>

        <button
          style={{backgroundColor: '#C9A0DC' }}
          onClick={() => navigate('/login')}
        >Get your QR</button>
      </div>      
    </>
  )
}

function App() {
  useEffect(() => {
		document.title = "My QR App - QR Attendance System";
	}, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />          

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
