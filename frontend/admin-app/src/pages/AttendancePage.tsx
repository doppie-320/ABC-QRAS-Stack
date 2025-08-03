import { useState, useEffect } from "react";

interface Student {
    studentId: string;
    name: string;
    studentNumber: string;
    timestamp?: string | null;
    status?: string;
    scannerId?: string
}

interface AttendanceEvent {
    eventId: string;
    eventName: string;
}

export default function AttendancePage() {
    const [events, setEvents] = useState<AttendanceEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [studentsWithStatus, setStudentsWithStatus] = useState<Student[]>([]);
    const [searchStudent, setSearchStudent] = useState("");
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Sorting states (event table)
    const [sortField, setSortField] = useState<keyof Student>("timestamp");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Sorting states (student history table)
    const [sortStudentField, setSortStudentField] = useState<keyof any>("timestamp");
    const [sortStudentOrder, setSortStudentOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/get-event-data`)
            .then(res => res.json())
            .then(data => setEvents(data));
    }, []);

    const loadAttendanceByEvent = () => {
        if (!selectedEvent) return;
        setLoading(true);
        fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/attendance-by-event?eventId=${selectedEvent}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
        })
            .then(res => res.json())
            .then(data => {
                const combined = [
                    ...(data.present || []).map((s: Student) => ({ ...s, status: "Present" })),
                    ...(data.rejected || []).map((s: Student) => ({ ...s, status: "Absent (Rejected)" })),
                    ...(data.absent || []).map((s: Student) => ({ ...s, status: "Absent (Not yet scanned)" }))
                ];
                setStudentsWithStatus(combined);
                setLoading(false);
            });
    };

    const loadAttendanceByStudent = () => {
        if (!searchStudent.trim()) return;
        fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/attendance-by-student?studentId=${searchStudent}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
        })
            .then(res => res.json())
            .then(data => setStudentHistory(data));
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Present":
                return { backgroundColor: "#27ae60", color: "#fff" };
            case "Absent (Rejected)":
                return { backgroundColor: "#e67e22", color: "#fff" };
            case "Absent (Not yet scanned)":
                return { backgroundColor: "#c0392b", color: "#fff" };
            default:
                return { backgroundColor: "#fff", color: "#000" };
        }
    };

    const formatTimestamp = (ts?: string | null) => {
        if (!ts) return "—";
        const date = new Date(ts);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    // Sorting helpers (event table)
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

    const sortedStudents = [...studentsWithStatus].sort((a, b) => {
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";
        if (sortField === "timestamp") {
            const timeA = valA ? new Date(valA as string).getTime() : 0;
            const timeB = valB ? new Date(valB as string).getTime() : 0;
            return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        }
        if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
    });

    // Sorting helpers (student history table)
    const handleSortStudent = (field: keyof any) => {
        if (sortStudentField === field) {
            setSortStudentOrder(sortStudentOrder === "asc" ? "desc" : "asc");
        } else {
            setSortStudentField(field);
            setSortStudentOrder("asc");
        }
    };

    const getSortArrowStudent = (field: keyof any) => {
        if (sortStudentField !== field) return "";
        return sortStudentOrder === "asc" ? " ▲" : " ▼";
    };

    const sortedStudentHistory = [...studentHistory].sort((a, b) => {
        const valA = a[sortStudentField] || "";
        const valB = b[sortStudentField] || "";
        if (sortStudentField === "timestamp") {
            const timeA = valA ? new Date(valA).getTime() : 0;
            const timeB = valB ? new Date(valB).getTime() : 0;
            return sortStudentOrder === "asc" ? timeA - timeB : timeB - timeA;
        }
        if (typeof valA === "string" && typeof valB === "string") {
            return sortStudentOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
    });

    return (
        <div style={{ padding: "1rem" }}>
            <h2>Attendance Management</h2>

            {/* Event Attendance */}
            <div style={{ marginBottom: "1rem" }}>
                <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                    <option value="">-- Select Event --</option>
                    {events.map(e => (
                        <option key={e.eventId} value={e.eventId}>{e.eventName}</option>
                    ))}
                </select>
                <button onClick={loadAttendanceByEvent}>Load</button>
            </div>

            {selectedEvent && (
                loading ? (
                    <p>Loading attendance...</p>
                ) : (
                    <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort("studentId")}>Student ID{getSortArrow("studentId")}</th>
                                    <th onClick={() => handleSort("name")}>Name{getSortArrow("name")}</th>
                                    <th onClick={() => handleSort("studentNumber")}>Student Number{getSortArrow("studentNumber")}</th>
                                    <th onClick={() => handleSort("status")}>Status{getSortArrow("status")}</th>
                                    <th onClick={() => handleSort("scannerId")}>Scanner{getSortArrow("scannerId")}</th>
                                    <th onClick={() => handleSort("timestamp")}>Timestamp{getSortArrow("timestamp")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map(s => (
                                    <tr key={s.studentId} style={getStatusStyle(s.status || "")}>
                                        <td>{s.studentId}</td>
                                        <td>{s.name}</td>
                                        <td>{s.studentNumber}</td>
                                        <td>{s.status}</td>
                                        <td>{s.scannerId || "—"}</td>
                                        <td>{formatTimestamp(s.timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                    </table>
                )
            )}

            <hr />

            {/* Student History */}
            <div style={{ marginTop: "1rem" }}>
                <input
                    type="text"
                    placeholder="Enter Student ID"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                />
                <button onClick={loadAttendanceByStudent}>Search</button>
            </div>

            {studentHistory.length > 0 && (
                <table border={1} cellPadding={8} style={{ marginTop: "1rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSortStudent("eventName")}>Event{getSortArrowStudent("eventName")}</th>
                            <th onClick={() => handleSortStudent("status")}>Status{getSortArrowStudent("status")}</th>
                            <th onClick={() => handleSortStudent("scannerId")}>Scanner{getSortArrowStudent("scannerId")}</th>
                            <th onClick={() => handleSortStudent("timestamp")}>Timestamp{getSortArrowStudent("timestamp")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudentHistory.map((row, idx) => (
                            <tr key={idx} style={getStatusStyle(row.status)}>
                                <td>{row.eventName}</td>
                                <td>{row.status}</td>
                                <td>{row.scannerId || "—"}</td>
                                <td>{formatTimestamp(row.timestamp)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
