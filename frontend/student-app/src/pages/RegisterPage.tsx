import { useNavigate } from 'react-router-dom';
import './pages.css'
import { useState } from "react"
import { backendUrl } from '../../../../shared/links';

export function RegisterPage() {
    const navigate = useNavigate();

    const [regName, setRegName] = useState('');
    const [regSN, setRegSN] = useState('');
    const [reg1Password, setReg1Password] = useState('');

    const [requestHasReturned, setRequestHasReturned] = useState(false);
    const [requestResponseText, setRequestResponseText] = useState('');
    const [requestResponseCode, setRequestResponseCode] = useState(-1);

    const registerRequest = async (): Promise<void> => {
        try {
            // alert(`Fetch to: ${`${backendUrl}/register/`}`);
            const response = await fetch(`${backendUrl}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentNumber: regSN,
                    name: regName,
                    password: reg1Password
                }),
            });
            setRequestHasReturned(true);

            if (!response.ok) {
                const errData = await response.json();
                // alert(`An error has occured: ${errorText}`);
                setRequestResponseCode(response.status);
                setRequestResponseText(errData.error);
                throw new Error(`Failed to register: ${errData.error}`);
            }
            const data = await response.json();
            
            setRequestResponseCode(response.status);
            setRequestResponseText(data.message);
        } catch(error) {
            setRequestHasReturned(true);
            setRequestResponseCode(-1);
            setRequestResponseText(`${error}`);
            // alert(`Error during registration: ${error}`);
            console.error(`Error during registration:`, error);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            {!requestHasReturned ? (
                <>
                    <h2>Register New Student</h2>
                    <form
                        id="fields-container"
                        onSubmit={(e) => {
                            e.preventDefault();
                            registerRequest();
                        }}
                    >
                        <input
                            className="styled-input"
                            placeholder="Full Name..."
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            required
                        />

                        <input
                            className="styled-input"
                            placeholder="Student Number (e.g. SOE****)..."
                            type="text"
                            value={regSN}
                            onChange={(e) => setRegSN(e.target.value)}
                            required
                        />

                        <input
                            className="styled-input"
                            placeholder="Password..."
                            type="password"
                            value={reg1Password}
                            onChange={(e) => setReg1Password(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            style={{ backgroundColor: '#C9A0DC', marginTop: '1rem' }}
                        >
                            Register
                        </button>
                    </form>
                </>
            ) : requestResponseCode === 200 ? (
                <div
                    style={{
                        backgroundColor: '#B2FBA5',
                        color: 'black',
                        padding: '25px',
                        borderRadius: '25px'
                    }}
                >
                    <h1>Registration Successful!</h1>
                    <p>Go back to the "Get Your QR" page to view your QR code.</p>
                </div>
            ) : (
                <div
                    style={{
                        backgroundColor: '#FF746C',
                        color: 'black',
                        padding: '25px',
                        borderRadius: '25px'
                    }}
                >
                    <h1>Error Occurred</h1>
                    <p>
                        <strong>Details:</strong> {requestResponseText}
                    </p>
                </div>
            )}

            <button
                onClick={() => navigate('/')}
                style={{
                    marginTop: '2rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',                    
                    cursor: 'pointer'
                }}
            >
                Back
            </button>
        </div>
    );
}