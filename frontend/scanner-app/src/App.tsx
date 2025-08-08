import { useState, useEffect } from 'react';
import './App.css';
import QRScanner from './components/QRScanner';

type Student = {
	id: string;
	studentNumber: string;
	name: string;
	pictureUrl?: string;
	department?: string; // code from backend
	yearLevel?: string;  // code from backend
};

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
	const [departments, setDepartments] = useState<Record<string, string>>({});
	const [yearLevels, setYearLevels] = useState<Record<string, string>>({});

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
		document.title = "Scanner App - QR Attendance System";
	}, []);

	// Fetch events
	useEffect(() => {
		(async () => {
			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-event-data`);
			setEvents(await res.json());
		})();
	}, []);

	// Fetch metadata
	useEffect(() => {
		(async () => {
			const resDept = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/DEPTDATA`);
			setDepartments(await resDept.json());

			const resYear = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/YEARDATA`);
			setYearLevels(await resYear.json());
		})();
	}, []);

	const handleScan = async (text: string) => {
		setQrText(text);

		try {
			const { studentId } = JSON.parse(text);
			const url = `${import.meta.env.VITE_BACKEND_URL}/student/${studentId}`;

			const res = await fetch(url);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Request failed');

			setStudent(data);
		} catch (e: any) {
			setError('Invalid QR or failed to fetch student info!');
			console.error(e);
		}
	};

	const handleDecision = async (accept: boolean) => {
		if (!eventId) {
			alert("You have selected an invalid event!");
			return;
		}
		if (!student) {
			alert("Invalid student data!");
			return;
		}

		const url = `${import.meta.env.VITE_BACKEND_URL}/log-attendance/`;
		const req = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				studentId: student.id,
				eventId: eventId,
				decision: accept ? 'accept' : 'reject',
				scannerId: username,
				scannerPassword: password,
			}),
		});
		const resp = await req.json();

		if (req.ok) {
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
				<div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', maxWidth: '300px', marginTop: '1rem' }}>
					<h3>Settings</h3>
					<label>Username:
						<input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%' }} />
					</label>
					<br />
					<label>Password:
						<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
					</label>
					<br />
					<label>Event:
						<select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: '100%', marginTop: '0.5rem' }}>
							<option value="">-- None --</option>
							{events.map((event) => (
								<option key={event.eventId} value={event.eventId}>{event.eventName}</option>
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
					<h3>ABC-QRAS: Scanner App</h3>
					<p style={{fontWeight: 'lighter', fontSize: 'smaller', color: 'gray'}}>This application should be distributed to authorized personnel only.</p>
					<p>Version 08072025</p>

					{!qrText && <QRScanner onScan={handleScan} />}

					{error && (
						<>
							<p style={{ color: 'red' }}>{error}</p>
							<button onClick={handleReset}>Reset</button>
						</>
					)}

					{student && (
						<div
							style={{
								maxWidth: '100%',
								margin: '0 auto',
								padding: '0.5rem',
								textAlign: 'center',
							}}
						>
							<h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Student Info</h2>

							{student.pictureUrl && (
								<img
									src={student.pictureUrl}
									alt="Profile"
									style={{
										width: '80%',
										maxWidth: '250px',
										borderRadius: '8px',
										objectFit: 'cover',
										marginBottom: '0.5rem',
									}}
								/>
							)}

							<p style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>
								<strong>Name:</strong> {student.name}
							</p>
							<p style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>
								<strong>Student No:</strong> {student.studentNumber}
							</p>
							<p style={{ fontSize: '1.1rem', margin: '0.2rem 0' }}>
								<strong>Department:</strong> {departments[student.department ?? ''] || 'Unknown'}
							</p>
							<p style={{ fontSize: '1.1rem', margin: '0.2rem 0 0.5rem' }}>
								<strong>Year Level:</strong> {yearLevels[student.yearLevel ?? ''] || 'Unknown'}
							</p>

							<div
								style={{
									display: 'flex',
									gap: '0.5rem',
									justifyContent: 'center',
									marginTop: '0.5rem',
								}}
							>
								<button
									onClick={() => handleDecision(true)}
									style={{
										backgroundColor: '#28a745',
										color: '#fff',
										fontSize: '1.2rem',
										padding: '0.7rem 1rem',
										border: 'none',
										borderRadius: '8px',
										cursor: 'pointer',
										flex: 1,
									}}
								>
									✅ Approve
								</button>
								<button
									onClick={() => handleDecision(false)}
									style={{
										backgroundColor: '#dc3545',
										color: '#fff',
										fontSize: '1.2rem',
										padding: '0.7rem 1rem',
										border: 'none',
										borderRadius: '8px',
										cursor: 'pointer',
										flex: 1,
									}}
								>
									❌ Deny
								</button>
							</div>

							{status && (
								<p style={{ marginTop: '0.5rem', fontSize: '1rem' }}>{status}</p>
							)}
						</div>
					)}


				</>
			)}
		</div>
	);
}

export default App;
