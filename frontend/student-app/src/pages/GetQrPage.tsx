import { useNavigate } from 'react-router-dom';
import './pages.css';
import { useState } from 'react';

type StudentQr = {
    name: string;
    studentNumber: string;
    qrData: string;
    departmentCode: string;
    yearLevelCode: string;
    departmentName?: string;
    yearLevelName?: string;
};

export function LoginPage() {
    const navigate = useNavigate();

    const [loginSN, setLoginSN] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [studentData, setStudentData] = useState<StudentQr | null>(null);

    const loginRequest = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-qr/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber: loginSN,
                    password: loginPassword
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Set codes first
                const baseData: StudentQr = {
                    name: data.name,
                    studentNumber: loginSN,
                    qrData: data.qrCode,
                    departmentCode: data.department,
                    yearLevelCode: data.yearLevel
                };

                // Fetch metadata names
                const [deptRes, yearRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/DEPTDATA`),
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/YEARDATA`)
                ]);

                const deptData = await deptRes.json();
                const yearData = await yearRes.json();

                baseData.departmentName = deptData[baseData.departmentCode] || baseData.departmentCode;
                baseData.yearLevelName = yearData[baseData.yearLevelCode] || baseData.yearLevelCode;

                setStudentData(baseData);
            } else {
                const errData = await response.json();
                setErrorMessage(`${errData.error}`);
            }
        } catch (error) {
            setErrorMessage(`${error}`);
            console.error(`Error during login:`, error);
        }
        setIsLoading(false);
    };

    return (
        <>
            {isLoading ? (
                <h1>Please wait...</h1>
            ) : (
                <>
                    {errorMessage ? (
                        <div
                            style={{
                                backgroundColor: '#FF746C',
                                color: 'black',
                                padding: '25px',
                                borderRadius: '25px'
                            }}
                        >
                            <h1>Error Occurred</h1>
                            <p><strong>Details:</strong> {errorMessage}</p>
                        </div>
                    ) : (
                        <>
                            {studentData ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        textAlign: 'center',
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        overflowX: 'hidden'
                                    }}
                                >
                                    {/* Student Name */}
                                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                                        {studentData.name}
                                    </h1>

                                    {/* Student Number */}
                                    <p style={{ fontSize: '1.5rem', margin: 0, wordBreak: 'break-word' }}>
                                        {studentData.studentNumber}
                                    </p>

                                    {/* Department & Year */}
                                    <p style={{
                                        fontSize: '1.4rem',
                                        marginTop: '0.25rem',
                                        color: '#ccc',
                                        wordBreak: 'break-word'
                                    }}>
                                        {studentData.departmentName} — {studentData.yearLevelName}
                                    </p>

                                    {/* QR Code */}
                                    <img
                                        src={studentData.qrData}
                                        style={{
                                            borderRadius: '1rem',
                                            width: '100%',
                                            maxWidth: '500px', // caps size for desktop
                                            height: 'auto',
                                            marginTop: '1rem'
                                        }}
                                        alt="Student QR"
                                    />

                                    {/* Download Button */}
                                    <button
                                        style={{
                                            marginTop: '1.5rem',
                                            backgroundColor: '#6CB4EE',
                                            color: 'white',
                                            border: 'none',
                                            padding: '15px 25px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            width: '100%',
                                            maxWidth: '400px'
                                        }}
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = studentData.qrData;
                                            link.download = `${studentData.studentNumber}-qr.png`;
                                            link.click();
                                        }}
                                    >
                                        📥 Download QR
                                    </button>
                                </div>

                            ) : (
                                <>
                                    <h2>Get your QR here</h2>
                                    <div id="fields-container">
                                        <input
                                            className='styled-input'
                                            placeholder='Student Number...'
                                            type="text"
                                            value={loginSN}
                                            onChange={(e) => setLoginSN(e.target.value)}
                                        />
                                        <input
                                            className='styled-input'
                                            placeholder='Password...'
                                            type="password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                        />
                                        <button
                                            style={{ backgroundColor: '#C9A0DC' }}
                                            onClick={loginRequest}
                                        >
                                            Get your QR now!
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </>
            )}
            <button
                onClick={() => navigate('/')}
                style={{ marginTop: '15px' }}
            >
                Back
            </button>
        </>
    );
}
