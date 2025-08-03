import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

import EventsPage from './pages/EventsPage'
import AttendancePage from './pages/AttendancePage'
import StudentsPage from './pages/StudentsPage'
import ScannersPage from './pages/ScannersPage'
import AdminLogin from './pages/LoginPage'
import RequireAdminAuth from './components/RequireAdminAuth'

function App() {
	useEffect(() => {
		document.title = "Admin Control Panel - QR Attendance System";
	}, []);

	return (
		<Router>
			<nav style={{ padding: "1rem", background: "#eee" }}>				
				<Link to="/">Dashboard</Link> | {" "}
				<Link to="/events">Events</Link> | {" "}
				<Link to="/scanners">Approved Scanners</Link> | {" "}				
				<Link to="/students">Students Directory</Link> | {" "}				
				<Link to="/attendance">Attendance</Link>
			</nav>
			<Routes>
				<Route path="/login" element={<AdminLogin/>}/>				

				<Route path="/" element={<RequireAdminAuth><></></RequireAdminAuth>}/>
				<Route path="/events" element={<RequireAdminAuth><EventsPage/></RequireAdminAuth>}/>
				<Route path="/attendance" element={<RequireAdminAuth><AttendancePage/></RequireAdminAuth>}/>
				<Route path="/students" element={<RequireAdminAuth><StudentsPage/></RequireAdminAuth>}/>
				<Route path="/scanners" element={<RequireAdminAuth><ScannersPage/></RequireAdminAuth>}/>
			</Routes>
		</Router>
	)
}

export default App
