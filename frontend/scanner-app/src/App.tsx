import { useState, useEffect } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import QRScanner from './components/QRScanner'

type Student = {
	id: String,
	studentNumber: string,
	name: string,
	pictureUrl?: string,
}

interface EventInfo {
	eventId: string;
	eventName: string;
}

function App() {
	const [showSettings, setShowSettings] = useState(false);
	const [username, setUsername] = useState(localStorage.getItem('scannerUsername') || '');
	const [password, setPassword] = useState(localStorage.getItem('scannerPassword') || '');	
	const [eventId, setEventId] = useState('');

	const [events, setEvents] = useState<EventInfo[]>([]);

	const saveCredentials = () => {
		localStorage.setItem('scannerUsername', username);
		localStorage.setItem('scannerPassword', password);
		setShowSettings(false);
	};

	const [qrText, setQrText] = useState<string | null>(null);
	const [student, setStudent] = useState<Student | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvents = async () => {
			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-event-data`);
			const data = await res.json();
			setEvents(data);
		};
		fetchEvents();
	}, []);

	const handleScan = async (text: string) => {
		setQrText(text);

		try {
			const { studentId } = JSON.parse(text);
			const url = `${import.meta.env.VITE_BACKEND_URL}/student/${studentId}`

			const res = await fetch(url);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Request failed');

			setStudent(data);
			console.log(data);
		} catch (e: any) {
			setError('Invalid QR or failed to fetch student info!');
			console.error(e);
		}
	};

	const handleDecision = async (accept: boolean) => {
		if(!eventId) {
			alert("You have selected an invalid event!");
			return;
		}

		if(!student) {
			alert("Invalid student data!");
			return;
		}

		const url = `${import.meta.env.VITE_BACKEND_URL}/log-attendance/`;
		const req = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				studentId: student.id,
				eventId: eventId,
				decision: accept ? 'accept' : 'reject',								
				scannerId: username,
				scannerPassword: password,
			}),
		});
		const resp = await req.json();

		if(req.ok) {
			alert(`BACKEND SYSTEM SAYS: ${resp.message}`);
		} else {
			alert(`BACKEND SYSTEM SAYS: ${resp.error}`);
		}
		setQrText(null);
		setStudent(null);
		setError(null);
		setStatus(null);
	};

	const handleReset = () => {
		setQrText(null);
		setStudent(null);
		setError(null);
		setStatus(null);
	};

	return (
		<div style={{ padding: '2rem' }}>
			<div style={{ position: 'absolute', top: 10, right: 10 }}>
				<button onClick={() => setShowSettings(!showSettings)}>⚙️ Settings</button>
			</div>

			{showSettings && (
				<div style={{
					border: '1px solid #ccc',
					borderRadius: '8px',
					padding: '1rem',
					maxWidth: '300px',
					marginTop: '1rem'
				}}>
					<h3>Settings</h3>
					<label>Username:
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							style={{ width: '100%' }}
						/>
					</label>
					<br />
					<label>Password:
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							style={{ width: '100%' }}
						/>
					</label>
					<br />
					<label>Event:
						<select
							value={eventId}
							onChange={(e) => setEventId(e.target.value)}
							style={{ width: '100%', marginTop: '0.5rem' }}
						>
							<option value="">-- None --</option>
							{events.map((event) => (
								<option key={event.eventId} value={event.eventId}>
									{event.eventName}
								</option>
							))}
						</select>
					</label>
					<br />
					<button onClick={saveCredentials}>Save</button>
					<button onClick={() => setShowSettings(false)} style={{ marginLeft: '1rem' }}>Cancel</button>
				</div>
			)}

			{!showSettings && (
				<>
					<h1>QR Attendance Scanner</h1>
					<p>Version 07212025-0138</p>

					{!qrText && <QRScanner onScan={handleScan} />}

					{error && (
						<>
							<p style={{ color: 'red' }}>{error}</p>
							<button onClick={handleReset}>Reset</button>
						</>
					)}

					{student && (
						<div>
							<h2>Student Info:</h2>
							{student.pictureUrl && (
								<img
									src={student.pictureUrl}
									alt="Profile"
									style={{ width: '150px', height: '150px', borderRadius: '5px', objectFit: 'cover', marginBottom: '1rem' }}
								/>
							)}
							<p><strong>Name:</strong> {student.name}</p>
							<p><strong>Student Number:</strong> {student.studentNumber}</p>

							<button onClick={() => handleDecision(true)} style={{ marginRight: '1rem' }}>✅ Approve</button>
							<button onClick={() => handleDecision(false)} style={{ marginRight: '1rem' }}>❌ Deny</button>

							{status && <p>{status}</p>}
						</div>
					)}</>
			)}
		</div>
	)
}

export default App;