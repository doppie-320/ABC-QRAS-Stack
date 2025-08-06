// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import { LoginPage } from './pages/GetQrPage'
import { RegisterPage } from './pages/RegisterPage'
import { useEffect } from 'react';
import CustomButton from './components/CustomButton';

import { PersonAddOutline, QrCodeOutline } from 'react-ionicons';
import { NavBar } from './components/NavBar';
import { AboutPage } from './pages/AboutPage';

function HomePage() {
  return (
    <>
      <NavBar/>

      <h2>ABC-QRAS - My Student QR App</h2>
      <h3>Welcome!</h3>
      <div id='button-container'>
        <CustomButton
          to="/register"
          label="Step 1: Register"
          backgroundColor="#242424"
          icon={PersonAddOutline}
        />
        <CustomButton
          to="/login"
          label="Step 2: Get your QR"
          backgroundColor="#3a87b5"
          icon={QrCodeOutline}
        />
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
          <Route path="/about" element={<AboutPage />} />    

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
