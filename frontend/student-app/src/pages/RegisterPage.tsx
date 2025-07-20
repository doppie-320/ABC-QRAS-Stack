import { useNavigate } from 'react-router-dom';
import './pages.css'
import { useState } from "react"
import { backendUrl } from '../../../../shared/links';

export function RegisterPage() {
    const navigate = useNavigate();

    const [regName, setRegName] = useState('');
    const [regSN, setRegSN] = useState('');
    const [reg1Password, setReg1Password] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [hasAttempted, setHasAttempted] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successStatus, setSuccessStatus] = useState<boolean>(false);    

    // const registerRequest = async (): Promise<void> => {
    //     try {
    //         // alert(`Fetch to: ${`${backendUrl}/register/`}`);
    //         const response = await fetch(`${backendUrl}/register/`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 studentNumber: regSN,
    //                 name: regName,
    //                 password: reg1Password
    //             }),
    //         });
    //         setRequestHasReturned(true);

    //         if (!response.ok) {
    //             const errData = await response.json();
    //             // alert(`An error has occured: ${errorText}`);
    //             setRequestResponseCode(response.status);
    //             setRequestResponseText(errData.error);
    //             throw new Error(`Failed to register: ${errData.error}`);
    //         }
    //         const data = await response.json();
            
    //         setRequestResponseCode(response.status);
    //         setRequestResponseText(data.message);
    //     } catch(error) {
    //         setRequestHasReturned(true);
    //         setRequestResponseCode(-1);
    //         setRequestResponseText(`${error}`);
    //         // alert(`Error during registration: ${error}`);
    //         console.error(`Error during registration:`, error);
    //     }
    // };

    // return (
    //     <div style={{ padding: '2rem' }}>
    //         {!requestHasReturned ? (
    //             <>
    //                 <h2>Register New Student</h2>
    //                 <form
    //                     id="fields-container"
    //                     onSubmit={(e) => {
    //                         e.preventDefault();
    //                         registerRequest();
    //                     }}
    //                 >
    //                     <input
    //                         className="styled-input"
    //                         placeholder="Full Name..."
    //                         type="text"
    //                         value={regName}
    //                         onChange={(e) => setRegName(e.target.value)}
    //                         required
    //                     />

    //                     <input
    //                         className="styled-input"
    //                         placeholder="Student Number (e.g. SOE****)..."
    //                         type="text"
    //                         value={regSN}
    //                         onChange={(e) => setRegSN(e.target.value)}
    //                         required
    //                     />

    //                     <input
    //                         className="styled-input"
    //                         placeholder="Password..."
    //                         type="password"
    //                         value={reg1Password}
    //                         onChange={(e) => setReg1Password(e.target.value)}
    //                         required
    //                     />

    //                     <button
    //                         type="submit"
    //                         style={{ backgroundColor: '#C9A0DC', marginTop: '1rem' }}
    //                     >
    //                         Register
    //                     </button>
    //                 </form>
    //             </>
    //         ) : requestResponseCode === 200 ? (
    //             <div
    //                 style={{
    //                     backgroundColor: '#B2FBA5',
    //                     color: 'black',
    //                     padding: '25px',
    //                     borderRadius: '25px'
    //                 }}
    //             >
    //                 <h1>Registration Successful!</h1>
    //                 <p>Go back to the "Get Your QR" page to view your QR code.</p>
    //             </div>
    //         ) : (
    //             <div
    //                 style={{
    //                     backgroundColor: '#FF746C',
    //                     color: 'black',
    //                     padding: '25px',
    //                     borderRadius: '25px'
    //                 }}
    //             >
    //                 <h1>Error Occurred</h1>
    //                 <p>
    //                     <strong>Details:</strong> {requestResponseText}
    //                 </p>
    //             </div>
    //         )}

    //         <button
    //             onClick={() => navigate('/')}
    //             style={{
    //                 marginTop: '2rem',
    //                 padding: '0.75rem 1.25rem',
    //                 borderRadius: '8px',
    //                 border: 'none',                    
    //                 cursor: 'pointer'
    //             }}
    //         >
    //             Back
    //         </button>
    //     </div>
    // );

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
        });
    };

    const registerRequest = async(): Promise<void> => {
        setIsLoading(true);
        try {            
            if(!selectedImage) {
                setSuccessStatus(false);
                setIsLoading(false);
                setErrorMessage("You did not set a proper image");
                setHasAttempted(true);
                return;
            }

            const response = await fetch(`${backendUrl}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentNumber: regSN,
                    name: regName,
                    password: reg1Password,
                    pictureB64: await fileToBase64(selectedImage),
                }),
            });

            if(response.ok) {
                setSuccessStatus(response.status == 200);
            } else {
                const errData = await response.json();
                setErrorMessage(`${errData.error}`)
            }

            setIsLoading(false);
            setHasAttempted(true);
        } catch(err) {
            setErrorMessage(`${err}`);
            setSuccessStatus(false);            
            setIsLoading(false);
            console.error(`Error during registration:`, errorMessage);
            setHasAttempted(true);
        }        
    };

    const ProfilePictureEntry = () => {
        return (
            <>
                {selectedImage ?
                    //Display image and remove button
                    (<>
                        <img
                            width={"250px"}
                            src={URL.createObjectURL(selectedImage)}
                        />
                        <button
                        className="remove-button"
                        onClick={() => {setSelectedImage(null)}}>
                            Remove</button>
                    </>) :
                    //Add an add image button
                    (
                        <input
                        type='file'
                        name='profilePicture'
                        onChange={(e) => {
                            if(!e.target.files) return;
                            setSelectedImage(e.target.files[0]);
                        }}/>
                    )}
            </>
        );
    };

    const AttemptDoneSupPage = () => {
        return (
            <div
                className={`result-div ${successStatus ? 'result-good' : 'result-bad'}`}>
                <h1>{successStatus ?
                'Registration success!' :
                'There was an issue processing your registration!'}</h1>
                <p>{successStatus ?
                'Go back to the "Get Your QR" page to view your QR code.':
                `ERROR: ${errorMessage}`}</p>                
            </div>
        );
    };

    const RegisterForm = () => {
        return (
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

                    <ProfilePictureEntry/>

                    <button
                        type="submit"
                        style={{ backgroundColor: '#C9A0DC', marginTop: '1rem' }}
                    >
                        Register
                    </button>
                </form>
            </>
        )
    };

    return (
        <>
            {isLoading ?
                //Is Loading
                (<h1>Please wait</h1>) :
                //Is not loading
                (<>
                    {hasAttempted ?
                        //Has attempted to register
                        <AttemptDoneSupPage/> :
                        //Has not pressed register yet
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

                                <ProfilePictureEntry />

                                <button
                                    type="submit"
                                    style={{ backgroundColor: '#C9A0DC', marginTop: '1rem' }}
                                >
                                    Register
                                </button>
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
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                Back
            </button>
        </>
    );

    
}