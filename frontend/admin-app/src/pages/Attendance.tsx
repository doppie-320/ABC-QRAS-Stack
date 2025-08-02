import { useState, useEffect } from "react";

interface Student {
    studentId: string;
    name: string;
    studentNumber: string;
}
interface AttendanceEvent {
    eventId: string;
    eventName: string;
}

export default function AttendancePage() {
    const [events, setEvents] = useState<AttendanceEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [present, setPresent] = useState<Student[]>([]);
    const [absent, setAbsent] = useState<Student[]>([]);
    const [searchStudent, setSearchStudent] = useState("");
    const [studentHistory, setStudentHistory] = useState<any[]>([]);

    // Fetch event list
    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/get-event-data`)
            .then(res => res.json())
            .then(data => setEvents(data));
    }, []);

    // Fetch attendance for event
    const loadAttendanceByEvent = () => {
        if (!selectedEvent) return;
        fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/attendance-by-event?eventId=${selectedEvent}`)
            .then(res => res.json())
            .then(data => {
                setPresent(data.present || []);
                setAbsent(data.absent || []);
            });
    };

    // Search student attendance history
    const loadAttendanceByStudent = () => {
        if (!searchStudent.trim()) return;
        fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/attendance-by-student?studentId=${searchStudent}`)
            .then(res => res.json())
            .then(data => setStudentHistory(data));
    };

    return (
        <div style={{ padding: "1rem" }}>
            <h2>Attendance Management</h2>

            {/* Filter by event */}
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
                <div style={{ display: "flex", gap: "2rem" }}>
                    <div>
                        <h3 style={{ color: "green" }}>Present</h3>
                        <ul>
                            {present.map(s => (
                                <li key={s.studentId}>{s.name} ({s.studentNumber})</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 style={{ color: "red" }}>Absent</h3>
                        <ul>
                            {absent.map(s => (
                                <li key={s.studentId}>{s.name} ({s.studentNumber})</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <hr />

            {/* Search by student */}
            <div>
                <input
                    type="text"
                    placeholder="Enter Student ID"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                />
                <button onClick={loadAttendanceByStudent}>Search</button>
            </div>

            {studentHistory.length > 0 && (
                <table border={1} cellPadding={8} style={{ marginTop: "1rem", width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Status</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentHistory.map((row, idx) => (
                            <tr key={idx} style={{ backgroundColor: row.status === "present" ? "#c8f7c5" : "#f7c5c5" }}>
                                <td>{row.eventName}</td>
                                <td>{row.status}</td>
                                <td>{row.timestamp || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}