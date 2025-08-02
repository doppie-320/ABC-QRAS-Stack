import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

function App() {
	return (
		<Router>
			<nav style={{ padding: "1rem", background: "#eee" }}>
				<Link to="/">Dashboard</Link> | {" "}
				<Link to="/events">Events</Link> | {" "}
			</nav>
			<Routes>
				<Route path="/" element={<></>}/>
				<Route path="/events" element={<></>}/>
			</Routes>
		</Router>
	)
}

export default App
