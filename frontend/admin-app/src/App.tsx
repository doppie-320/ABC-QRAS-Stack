import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

import EventsPage from './pages/EventsPage'
import AttendancePage from './pages/AttendancePage'
import StudentsPage from './pages/StudentsPage'
import ScannersPage from './pages/ScannersPage'

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
				<Route path="/" element={<></>}/>
				<Route path="/events" element={<EventsPage/>}/>
				<Route path="/attendance" element={<AttendancePage/>}/>
				<Route path="/students" element={<StudentsPage/>}/>
				<Route path="/scanners" element={<ScannersPage/>}/>
			</Routes>
		</Router>
	)
}

export default App
