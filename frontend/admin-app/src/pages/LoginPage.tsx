import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/login`, {            
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if(!res.ok) {
                setError(data.error || "Login failed!");
            } else {
                localStorage.setItem("adminToken", data.token);
                navigate("/");
            }
        } catch (err) {
            setError(`Network error, please try again. (err:${err})`);
        }

        setLoading(false);
    };

    return (
    <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
        fontFamily: "sans-serif"
    }}>
        <div style={{
            background: "#1e1e1e",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.5)",
            width: "100%",
            maxWidth: "400px"
        }}>
            <h2 style={{ textAlign: "center", marginBottom: "1rem", color: "#fff" }}>Admin Login</h2>
            
            {error && (
                <div style={{
                    backgroundColor: "#e74c3c",
                    padding: "0.75rem",
                    borderRadius: "5px",
                    marginBottom: "1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                }}>
                    {error}
                </div>
            )}

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                    width: "100%",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    borderRadius: "5px",
                    border: "1px solid #333",
                    backgroundColor: "#2a2a2a",
                    color: "#fff"
                }}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                    width: "100%",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    borderRadius: "5px",
                    border: "1px solid #333",
                    backgroundColor: "#2a2a2a",
                    color: "#fff"
                }}
            />

            <button
                onClick={handleLogin}
                style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "none",
                    borderRadius: "5px",
                    backgroundColor: "#9b59b6",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "1rem"
                }}
            >
                {loading ? "Logging in..." : "Login"}
            </button>
        </div>
    </div>
);

}