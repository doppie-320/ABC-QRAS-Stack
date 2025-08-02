import { useNavigate } from 'react-router-dom';
import './pages.css';
import { useState } from 'react';

type StudentQr = {
    name: string,
    studentNumber: string,
    qrData: string
}

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentNumber: loginSN,
                    password: loginPassword
                }),
            });
                    
            if (response.ok) {
                if (response.status == 200) {
                    const data = await response.json();

                    setStudentData({
                        name: data.name,
                        studentNumber: loginSN,
                        qrData: data.qrCode
                    });
                }            
            } else {
                const errData = await response.json();                
                setErrorMessage(`${errData.error}`);
            }

            setIsLoading(false);
        } catch (error) {
            setErrorMessage(`${error}`);
            console.error(`Error during login:`, error);
            setIsLoading(false);
        }
    }

    return (
        <>
            {isLoading ?
                //Is Loading
                (<h1>Please wait...</h1>) :
                //Is not loading
                (<>
                    {errorMessage ?
                        //Has error message
                        (<>
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
                                    <strong>Details:</strong> {errorMessage}
                                </p>
                            </div>
                        </>) :

                        //No error message
                        (<>
                            {studentData ?
                                //Student data displayed
                                (<>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column' 
                                        }}
                                    >
                                        <h1>{studentData.name}</h1>
                                        <p>{loginSN}</p>
                                        <img
                                            src={studentData.qrData}
                                            style={{ borderRadius: '1rem' }}
                                        />
                                    </div>
                                </>) :
                                //Still going to login
                                (<>
                                    <h2>Get your QR here</h2>

                                    <div id="fields-container">
                                        <input
                                            className='styled-input'
                                            placeholder='Student Number...'
                                            type="text"
                                            value={loginSN}
                                            onChange={(e) => { setLoginSN(e.target.value) }}
                                        ></input>
                                        <input
                                            className='styled-input'
                                            placeholder='Password...'
                                            type="password"
                                            value={loginPassword}
                                            onChange={(e) => { setLoginPassword(e.target.value) }}
                                        ></input>
                                        <button
                                            style={{backgroundColor: '#C9A0DC'}}
                                            onClick={() => loginRequest()}
                                        >Get your QR now!</button>
                                    </div>
                                </>)}
                        </>)
                    }
                </>)}

            <button
                onClick={() => navigate('/')}
                style={{ marginTop: '15px' }}
            >Back</button>
        </>
    );
}