import { useNavigate } from "react-router-dom";

export function AboutPage() {
    const navigate = useNavigate();

    const getBuildType = (): string => {
        const isVercel = import.meta.env.VERCEL === '1';

        if(!isVercel) {
            return "Dev";
        } else {
            if(import.meta.env.VITE_VERCEL_ENV) {
                return "Vercel Production";
            } else {
                return "Vercel Preview";
            }
        }
    }

    return (
        <>
            <h1>ABC - QR Attendance System (QRAS)</h1>
            <p style={{color: 'gray', fontSize: 'smaller'}}>Version (VID: 08042025)</p>
            <p style={{color: 'gray', fontSize: 'smaller'}}>Build Type: {getBuildType()}</p>

            <p>© 2025 Andres Bonifacio College. All rights reserved.</p>
            <p style={{color: 'gray', fontSize: 'smaller'}}>Developed by: Anthony James Moran (@doppiedops)</p>
            <button onClick={() => navigate('/')}>Back</button>
        </>
    )
}