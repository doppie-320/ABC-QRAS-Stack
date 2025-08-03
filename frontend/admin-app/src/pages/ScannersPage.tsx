import { useEffect, useState } from "react";

interface Scanner {
    scannerId: string;
    password: string;
}

export default function ScannersPage() {
    const [scanners, setScanners] = useState<Scanner[]>([]);
    const [newScannerId, setNewScannerId] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState<Record<string, boolean>>({}); // track reveal per scanner

    const fetchScanners = async () => {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/get-scanners`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            method: "POST"
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "/login";
            return;
        }

        const data = await res.json();
        setScanners(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchScanners();
    }, []);

    const addScanner = async () => {
        if (!newScannerId.trim() || !newPassword.trim()) return;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/add-scanner`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ scannerId: newScannerId, password: newPassword })
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "/login";
            return;
        }

        setNewScannerId("");
        setNewPassword("");
        fetchScanners();
    };

    const deleteScanner = async (id: string) => {
        if (!window.confirm(`Delete scanner ${id}?`)) return;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/del-scanner`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ scannerId: id })
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "/login";
            return;
        }

        fetchScanners();
    };

    const toggleReveal = (id: string) => {
        setRevealed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div style={{ padding: "1rem" }}>
            <h2>Manage Scanners</h2>

            <div style={{ marginBottom: "1rem" }}>
                <input
                    type="text"
                    placeholder="Scanner ID"
                    value={newScannerId}
                    onChange={(e) => setNewScannerId(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />
                <button onClick={addScanner}>Add Scanner</button>
            </div>

            {loading ? (
                <p>Loading scanners...</p>
            ) : (
                <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Scanner ID</th>
                            <th>Password</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scanners.map(s => (
                            <tr key={s.scannerId}>
                                <td>{s.scannerId}</td>
                                <td>
                                    {revealed[s.scannerId] ? (
                                        s.password
                                    ) : (
                                        "••••••••"
                                    )}
                                    <button
                                        onClick={() => toggleReveal(s.scannerId)}
                                        style={{ marginLeft: "0.5rem" }}
                                    >
                                        {revealed[s.scannerId] ? "Hide" : "Show"}
                                    </button>
                                </td>
                                <td>
                                    <button onClick={() => deleteScanner(s.scannerId)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
