import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import QRScanner from './components/QRScanner'
import { backendUrl } from '../../../shared/links';

type Student = {
  id: String,
  studentNumber: string,
  name: string
}

function App() {
  const [qrText, setQrText] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleScan = async (text: string) => {
    setQrText(text);

    try {
      const { studentId } = JSON.parse(text);      
      const url = `${backendUrl}/student/${studentId}`

      alert(`Fetch: ${url}`);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      
      setStudent(data);      
    } catch(e :any) {
      setError('Invalid QR or failed to fetch student info!');
      console.error(e);
    }
  };

  const handleApprove = async() => {
    if(!student) return;
    //POST log
    setStatus('Attendance logged successfully!');
  };

  const handleReset = () => {
    setQrText(null);
    setStudent(null);
    setError(null);
    setStatus(null);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>QR Attendance Scanner</h1>
      <p>Version 07072025-0330</p>

      {!qrText && <QRScanner onScan={handleScan}/>}

      {error && (
        <>
          <p style={{color: 'red'}}>{error}</p>
          <button onClick={handleReset}>Reset</button>
        </>        
      )}

      {student && (
        <div>
          <h2>Student Info:</h2>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Student Number:</strong> {student.studentNumber}</p>

          <button onClick={handleApprove} style={{ marginRight: '1rem' }}>✅ Approve</button>          
          <button onClick={handleReset} style={{ marginRight: '1rem' }}>❌ Deny</button>                    

          {status && <p>{status}</p>}
        </div>
      )}
    </div>
  )
}

export default App;