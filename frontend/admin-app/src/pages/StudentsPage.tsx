import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { multiSelectDarkTheme } from "../components/MultiSelectStyle";

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

    //Filters
    const [nameSearch, setNameSearch] = useState("");
    const [studentNumberSearch, setStudentNumberSearch] = useState("");
    const [selectedYears, setSelectedYears] = useState<string[]>([]);
    const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

    //Metadata
    const [departmentData, setDepartmentData] = useState<Record<string, string>>({});
    const [yearLevelData, setYearLevelData] = useState<Record<string, string>>({});

    //Pagination
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;

    const navigate = useNavigate();

    const fetchStudents = async () => {
        setLoading(true);

        const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/admin/search-students`);
        url.searchParams.set("limit", limit.toString());
        url.searchParams.set("page", page.toString());

        if (nameSearch) url.searchParams.set("search", nameSearch.trim());        
        if(studentNumberSearch) url.searchParams.set("studentNumber", studentNumberSearch.trim());
        if(selectedYears.length) url.searchParams.set("years", selectedYears.join(","));
        if(selectedDepts.length) url.searchParams.set("depts", selectedDepts.join(","));
        
        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
        });
        
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            navigate("/login");
            return;
        }

        const data = await res.json();
        setStudents(data.items);
        setTotalPages(data.totalPages || 0);
        setLoading(false);
    };

    const deleteStudent = async (id: string) => {
        if (!confirm("Are you sure you want to delete this student?")) return;

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/del-student`, {
            method: "POST", // or DELETE depending on your backend
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ id })
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            navigate("/login");
            return;
        }

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Failed to delete student.");
            return;
        }

        fetchStudents();
    };

    useEffect(() => {
        fetchStudents();
    }, [page]);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
		(async () => {
			const resDept = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/DEPTDATA`);
			setDepartmentData(await resDept.json());

			const resYear = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/YEARDATA`);
			setYearLevelData(await resYear.json());
		})();
	}, []);

    return (
        <div style={{ padding: "1rem" }}>
            <h2>All Students</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {/* Row 1: Name + Student Number */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem' // ✅ Ensures space below row 1
                    }}
                >
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#fff' }}>Name</label>
                        <input
                            type="text"
                            placeholder="Search by name"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            style={{ padding: "0.5rem", width: "100%" }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#fff' }}>Student Number</label>
                        <input
                            type="text"
                            placeholder="Search by student number"
                            value={studentNumberSearch}
                            onChange={(e) => setStudentNumberSearch(e.target.value)}
                            style={{ padding: "0.5rem", width: "100%" }}
                        />
                    </div>
                </div>

                {/* Row 2: Year Level + Department + Search */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#fff' }}>Year Level</label>
                        <Select
                            isMulti
                            options={Object.entries(yearLevelData).map(([value, label]) => ({
                                value, label
                            }))}
                            value={selectedYears.map(y => ({ value: y, label: yearLevelData[y] }))}
                            onChange={(selected) => setSelectedYears(selected.map(opt => opt.value))}
                            styles={multiSelectDarkTheme}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#fff' }}>Department</label>
                        <Select
                            isMulti
                            options={Object.entries(departmentData).map(([value, label]) => ({
                                value, label
                            }))}
                            value={selectedDepts.map(y => ({ value: y, label: departmentData[y] }))}
                            onChange={(selected) => setSelectedDepts(selected.map(opt => opt.value))}
                            styles={multiSelectDarkTheme}
                        />
                    </div>
                </div>

                <button
                    onClick={() => {
                        setPage(0);
                        fetchStudents();
                    }}
                    style={{ padding: "0.5rem 1rem", background: "#444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    Search
                </button>
            </div>

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
                                        <button onClick={() => deleteStudent(s.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "1rem",
                            gap: "0.5rem",
                        }}
                    >
                        <button
                            disabled={page <= 0}
                            onClick={() => setPage(page - 1)}
                        >Prev</button>

                        <span>Page {page+1} of {totalPages}</span>

                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                        >Next</button>
                    </div>
                </>
            )}
        </div>
    );
}
