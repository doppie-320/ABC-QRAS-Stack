import { useState, useEffect } from "react";

interface Student {
    id: string;
    name: string;
    studentNumber: string;
    pictureUrl: string;
    departmentCode?: string;
    yearCode?: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof Student>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const [departments, setDepartments] = useState<Record<string, string>>({});
    const [yearLevels, setYearLevels] = useState<Record<string, string>>({});

    const fetchStudents = async () => {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/get-all-students`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
        });
        const data = await res.json();
        setStudents(data);
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            const resDept = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/DEPTDATA`);
            setDepartments(await resDept.json());

            const resYear = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/YEARDATA`);
            setYearLevels(await resYear.json());
        })();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSort = (field: keyof Student) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const getSortArrow = (field: keyof Student) => {
        if (sortField !== field) return "";
        return sortOrder === "asc" ? " ▲" : " ▼";
    };

    const deleteStudent = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/del-student`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ id })
        });
        fetchStudents();
    };

    const filtered = students.filter(s => {
        const deptName = departments[s.departmentCode!] || "";
        const yearName = yearLevels[s.yearCode!] || "";

        const searchLower = search.toLowerCase();
        return (
            s.name.toLowerCase().includes(searchLower) ||
            s.studentNumber.toLowerCase().includes(searchLower) ||
            deptName.toLowerCase().includes(searchLower) ||
            yearName.toLowerCase().includes(searchLower)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";
        if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
    });

    return (
        <div style={{ padding: "1rem" }}>
            <h2>All Students</h2>

            <input
                type="text"
                placeholder="Search by name student number, year level, or department"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            />

            {loading ? (
                <p>Loading students...</p>
            ) : (
                <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                            <tr>
                                <th>Picture</th>
                                <th onClick={() => handleSort("name")}>Name{getSortArrow("name")}</th>
                                <th onClick={() => handleSort("studentNumber")}>Student Number{getSortArrow("studentNumber")}</th>
                                <th>Department</th>
                                <th>Year</th>
                                <th onClick={() => handleSort("id")}>UUID{getSortArrow("id")}</th>
                                <th>Actions</th>
                            </tr>
                    </thead>
                    <tbody>
                        {sorted.map((s) => (
                            <tr key={s.id}>
                                <td>
                                    <img
                                        src={s.pictureUrl}
                                        alt={s.name}
                                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                                    />
                                </td>
                                <td>{s.name}</td>
                                <td>{s.studentNumber}</td>
                                <td>{departments[s.departmentCode!] || "—"}</td>
                                <td>{yearLevels[s.yearCode!] || "—"}</td>                                
                                <td style={{ fontSize: "0.8rem", color: "#555" }}>{s.id}</td>
                                <td>
                                    <button
                                        style={{ backgroundColor: "#c0392b", color: "#fff", padding: "0.3rem 0.6rem" }}
                                        onClick={() => deleteStudent(s.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
