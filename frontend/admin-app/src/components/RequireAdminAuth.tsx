import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";

export default function RequireAdminAuth({ children }: { children: JSX.Element }) {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if(!token) {
            navigate("/login");
        }
    }, [navigate]);

    return children;
}