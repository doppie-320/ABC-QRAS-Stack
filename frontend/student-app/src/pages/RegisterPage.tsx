import { useNavigate } from 'react-router-dom';
import './pages.css'
import { useState, useEffect, useRef } from "react"

import Croppie from 'croppie';
import 'croppie/croppie.css';
import { NavBar } from '../components/NavBar';

export function RegisterPage() {
    const navigate = useNavigate();

    const [regName, setRegName] = useState('');
    const [regSN, setRegSN] = useState('');
    const [reg1Password, setReg1Password] = useState('');
    const [reg2Password, setReg2Password] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [croppedBase64, setCroppedBase64] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const croppieRef = useRef<HTMLDivElement>(null);
    const croppieInstance = useRef<any>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const [departments, setDepartments] = useState<Record<string, string>>({});
    const [yearLevels, setYearLevels] = useState<Record<string, string>>({});
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [hasAttempted, setHasAttempted] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successStatus, setSuccessStatus] = useState<boolean>(false);

    const registerRequest = async (): Promise<void> => {
        setIsLoading(true);
        try {
            if (!croppedBase64) {
                setSuccessStatus(false);
                setIsLoading(false);
                setErrorMessage("You did not set a proper image");
                setHasAttempted(true);
                return;
            }

            if (reg1Password.length < 8) {
                setSuccessStatus(false);
                setIsLoading(false);
                setErrorMessage("Password must be at least 8 characters long");
                setHasAttempted(true);
                return;
            }

            if (reg1Password !== reg2Password) {
                setSuccessStatus(false);
                setIsLoading(false);
                setErrorMessage("Passwords do not match");
                setHasAttempted(true);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentNumber: regSN,
                    name: regName,
                    password: reg1Password,
                    pictureB64: croppedBase64,
                    department: selectedDept,
                    yearLevel: selectedYear,
                }),
            });

            if (response.ok) {
                setSuccessStatus(response.status == 200);
            } else {
                const errData = await response.json();
                setErrorMessage(`${errData.error}`)
            }

            setIsLoading(false);
            setHasAttempted(true);
        } catch (err) {
            setErrorMessage(`${err}`);
            setSuccessStatus(false);
            setIsLoading(false);
            console.error(`Error during registration:`, errorMessage);
            setHasAttempted(true);
        }
    };

    useEffect(() => {
        if (!reg1Password && !reg2Password) {
            setPasswordError(null);
        } else if (reg1Password.length < 8) {
            setPasswordError("Password must be at least 8 characters");
        } else if (reg1Password !== reg2Password) {
            setPasswordError("Passwords do not match");
        } else {
            setPasswordError(null);
        }
    }, [reg1Password, reg2Password]);

    useEffect(() => {
        (async () => {
            const resDept = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/DEPTDATA`);
            setDepartments(await resDept.json());

            const resYear = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/YEARDATA`);
            setYearLevels(await resYear.json());
        })();
    }, []);

    useEffect(() => {
        if (selectedImage && isCropping && croppieRef.current) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (croppieInstance.current) {
                    croppieInstance.current.destroy();
                }

                croppieInstance.current = new Croppie(croppieRef.current!, {
                    viewport: { width: 200, height: 200, type: 'square' },
                    boundary: { width: 300, height: 300 },
                    showZoomer: true,
                });

                croppieInstance.current.bind({
                    url: reader.result as string,
                });
            };
            reader.readAsDataURL(selectedImage);
        }
    }, [selectedImage, isCropping]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setSelectedImage(e.target.files[0]);
        setIsCropping(true);
    }

    const handleCropConfirm = async () => {
        if (!croppieInstance.current) return;

        const result = await croppieInstance.current.result({
            type: 'base64',
            size: 'viewport',
            format: 'jpeg',
            quality: 1
        });
        setCroppedBase64(result as string);
        setIsCropping(false);
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setCroppedBase64(null);
        setIsCropping(false);
    };

    const AttemptDoneSupPage = () => {
        return (
            <div
                className={`result-div ${successStatus ? 'result-good' : 'result-bad'}`}>
                <h1>{successStatus ?
                    'Registration success!' :
                    'There was an issue processing your registration!'}</h1>
                <p>{successStatus ?
                    'Go back to the "Get Your QR" page to view your QR code.' :
                    `ERROR: ${errorMessage}`}</p>
            </div>
        );
    };

    if (isCropping) {
        return (
            <div style={{ padding: '1rem' }}>
                <h2>Crop your profile picture</h2>
                <div ref={croppieRef} />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={handleCropConfirm} style={{ background: 'green', color: 'white' }}>Confirm Crop</button>
                    <button onClick={handleRemoveImage}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <NavBar/>

            {isLoading ?
                (<h1>Please wait</h1>) :
                (<>
                    {hasAttempted ?
                        <AttemptDoneSupPage /> :
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

                                <input
                                    className="styled-input"
                                    placeholder="Confirm Password..."
                                    type="password"
                                    value={reg2Password}
                                    onChange={(e) => setReg2Password(e.target.value)}
                                    required
                                />

                                {passwordError && (
                                    <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '-5px' }}>
                                        {passwordError}
                                    </p>
                                )}

                                <select
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        border: '1px solid #555',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        outlineColor: '#C9A0DC',
                                        backgroundColor: '#222',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Department</option>
                                    {Object.entries(departments).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        border: '1px solid #555',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        outlineColor: '#C9A0DC',
                                        backgroundColor: '#222',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Year Level</option>
                                    {Object.entries(yearLevels).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                    ))}
                                </select>

                                {!selectedImage && (
                                    <>
                                        <input
                                            type="file"
                                            name="profilePicture"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                        />
                                        <button type="button" onClick={() => fileInputRef.current?.click()}>
                                            Upload Photo
                                        </button>
                                    </>
                                )}

                                {croppedBase64 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
                                        <img src={croppedBase64} width={250} alt="Cropped profile" style={{ borderRadius: '10px' }} />
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="button" onClick={() => setIsCropping(true)}>Edit</button>
                                            <button type="button" onClick={handleRemoveImage}>Remove</button>
                                        </div>
                                    </div>
                                )}

                                {croppedBase64 && (
                                    <button
                                        type="submit"
                                        style={{
                                            backgroundColor: passwordError ? '#888' : '#3a87b5',
                                            marginTop: '1rem',
                                            cursor: passwordError ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={!!passwordError}
                                    >
                                        Register
                                    </button>
                                )}
                            </form>
                        </>
                    }
                </>)
            }
            <button
                onClick={() => navigate('/')}
                style={{
                    marginTop: '2rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',                    
                    cursor: 'pointer',
                }}
            >
                Back
            </button>
        </>
    );
}
