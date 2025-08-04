import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface EventInfo {
    eventId: string;
    eventName: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<EventInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEventName, setNewEventName] = useState("");
    const [newEventId, setNewEventId] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const navigate = useNavigate();

    const fetchEvents = async () => {
        setLoading(true);

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-event-data`);
        const data = await res.json();
        setEvents(data);

        setLoading(false);
    }

    useEffect(() => {
        fetchEvents();
    }, []);

    const addEvent = async () => {
        if (!newEventName.trim() || !newEventId.trim()) return;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/add-event`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ eventId: newEventId, eventName: newEventName })
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            navigate("/login");
            return;
        }

        setNewEventName(""); setNewEventId("");
        fetchEvents();
    };

    const deleteEvent = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/del-event`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ eventId: id }),
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            navigate("/login");
            return;
        }

        fetchEvents();
    }

    const startEdit = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    }

    const saveEdit = async () => {
        if(!editingId) return;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/add-event`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ eventId: editingId, eventName: editName }),
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            navigate("/login");
            return;
        }

        setEditingId(null);
        setEditName("");
        fetchEvents();
    }

    return (
        <div style={{ padding: "1rem" }}>
            <h2>Manage Events</h2>

            <div style={{ marginBottom: "1rem" }}>
                <input
                    type="text"
                    placeholder="New Event Id"
                    value={newEventId}
                    onChange={(e) => setNewEventId(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />
                <input
                    type="text"
                    placeholder="New Event Name"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />            
                <button onClick={addEvent}>Add Event</button>
            </div>

            {loading ? (
                <p>Loading events...</p>
            ) : (
                <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Event ID</th>
                            <th>Event Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: any) => (
                            <tr key={event.eventId}>
                                <td>{event.eventId}</td>
                                <td>
                                    {editingId === event.eventId ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    ) : (
                                        event.eventName
                                    )}
                                </td>
                                <td>
                                    {editingId === event.eventId ? (
                                        <>
                                            <button onClick={saveEdit}>Save</button>
                                            <button onClick={() => setEditingId(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(event.eventId, event.eventName)}>Edit</button>
                                            <button onClick={() => deleteEvent(event.eventId)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}