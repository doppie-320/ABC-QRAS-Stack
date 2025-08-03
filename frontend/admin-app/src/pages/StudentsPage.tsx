import { useState, useEffect } from "react";

interface Student {
    id: string;
    name: string;
    studentNumber: string;
    departmentName: string;
    yearName: string;
    pictureUrl: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [lastKey, setLastKey] = useState<string | null>(null);

    const fetchStudents = async (searchTerm = "", append = false, startKey: string | null = null) => {
        setLoading(true);
        const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/admin/get-all-students`);
        if (searchTerm) url.searchParams.set("search", searchTerm);
        if (startKey) url.searchParams.set("lastKey", startKey);
        url.searchParams.set("limit", "50");

        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
        });
        
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "/login";
            return;
        }

        const data = await res.json();
        setStudents(prev => append ? [...prev, ...data.items] : data.items);
        setLastKey(data.lastKey);
        setLoading(false);
    };

    useEffect(() => {
        fetchStudents(search);
    }, [search]);

    return (
        <div style={{ padding: "1rem" }}>
            <h2>All Students</h2>

            <input
                type="text"
                placeholder="Search by name, student number, dept, year"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />

            {loading && <p>Loading...</p>}

            {!loading && (
                <>
                    <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Picture</th>
                                <th>Name</th>
                                <th>Student Number</th>
                                <th>Department</th>
                                <th>Year Level</th>
                                <th>UUID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id}>
                                    <td><img src={s.pictureUrl} style={{ width: "60px", height: "60px", objectFit: "cover" }} /></td>
                                    <td>{s.name}</td>
                                    <td>{s.studentNumber}</td>
                                    <td>{s.departmentName}</td>
                                    <td>{s.yearName}</td>
                                    <td style={{ fontSize: "0.8rem" }}>{s.id}</td>
                                    <td>
                                        <button onClick={() => console.log("Delete student", s.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {lastKey && (
                        <button
                            style={{ marginTop: "1rem" }}
                            onClick={() => fetchStudents(search, true, lastKey)}
                        >
                            Load More
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
