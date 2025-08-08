import { useState, useEffect } from "react";
import Select from "react-select";
import { multiSelectDarkTheme } from "../components/MultiSelectStyle";

export default function AttendancePage() {
	const [nameSearch, setNameSearch] = useState("");
	const [studentNumberSearch, setStudentNumberSearch] = useState("");
	const [selectedYears, setSelectedYears] = useState<string[]>([]);
	const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
	const [yearLevelData, setYearLevelData] = useState<Record<string, string>>({});
	const [departmentData, setDepartmentData] = useState<Record<string, string>>({});
	const [eventOptions, setEventOptions] = useState<{ value: string; label: string }[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [timeFrom, setTimeFrom] = useState("");
	const [timeTo, setTimeTo] = useState("");
	const [scannerOptions, setScannerOptions] = useState<{ value: string; label: string }[]>([]);
	const [selectedScanner, setSelectedScanner] = useState<string | null>(null);

	const [items, setItems] = useState<any[]>([]);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const limit = 50;

	useEffect(() => {
		(async () => {
			const resDept = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/DEPTDATA`);
			setDepartmentData(await resDept.json());

			const resYear = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-student-metadata/YEARDATA`);
			setYearLevelData(await resYear.json());
		})();

		// Fetch events
		fetch(`${import.meta.env.VITE_BACKEND_URL}/get-event-data`)
			.then(res => res.json())
			.then(data => {
				setEventOptions(data.map((e: any) => ({ value: e.eventId, label: e.eventName })));
			});

		// Fetch scanners
		fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/get-scanners`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${localStorage.getItem("adminToken")}`
			}
		})
			.then(res => res.json())
			.then(data => {
				setScannerOptions(data.map((s: any) => ({ value: s.scannerId, label: s.scannerId })));
			});
	}, []);

	useEffect(() => {
		if (selectedEvent) {
			fetchData();
		}
	}, [page, selectedEvent]);

	const fetchData = () => {
		const params = new URLSearchParams();
		params.append("limit", String(limit));
		params.append("page", String(page));
		if (nameSearch) params.append("name", nameSearch);
		if (studentNumberSearch) params.append("studentNumber", studentNumberSearch);
		if (selectedYears.length) params.append("years", selectedYears.join(","));
		if (selectedDepts.length) params.append("departments", selectedDepts.join(","));
		if (selectedEvent) params.append("eventId", selectedEvent);
		if (statusFilter) params.append("status", statusFilter);
		if (selectedScanner) params.append("scannerId", selectedScanner);
		if (timeFrom) params.append("timeFrom", timeFrom);
		if (timeTo) params.append("timeTo", timeTo);

		fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/query-attendance?${params.toString()}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("adminToken")}`
			}
		})
			.then(res => res.json())
			.then(data => {
				setItems(data.items || []);
				setTotalPages(data.totalPages || 1);
			});
	};

	const formatTimestamp = (ts: string | null) => {
		if (!ts) return "—";
		const date = new Date(ts);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
	};

	return (
		<div style={{ padding: "1rem", color: "#fff" }}>
			<h2>Attendance Search</h2>

			{/* Row 1: Name + Student Number */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
				<div style={{ flex: 1, minWidth: "250px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Name</label>
					<input
						type="text"
						placeholder="Search by name"
						value={nameSearch}
						onChange={(e) => setNameSearch(e.target.value)}
						style={{ padding: "0.5rem", width: "100%" }}
					/>
				</div>
				<div style={{ flex: 1, minWidth: "250px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Student Number</label>
					<input
						type="text"
						placeholder="Search by student number"
						value={studentNumberSearch}
						onChange={(e) => setStudentNumberSearch(e.target.value)}
						style={{ padding: "0.5rem", width: "100%" }}
					/>
				</div>
			</div>

			{/* Row 2: Year Level + Department */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
				<div style={{ flex: 1, minWidth: "200px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Year Level</label>
					<Select
						isMulti
						options={Object.entries(yearLevelData).map(([value, label]) => ({ value, label }))}
						value={selectedYears.map(y => ({ value: y, label: yearLevelData[y] }))}
						onChange={(selected) => setSelectedYears(selected.map(opt => opt.value))}
						styles={multiSelectDarkTheme}
					/>
				</div>
				<div style={{ flex: 1, minWidth: "200px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Department</label>
					<Select
						isMulti
						options={Object.entries(departmentData).map(([value, label]) => ({ value, label }))}
						value={selectedDepts.map(y => ({ value: y, label: departmentData[y] }))}
						onChange={(selected) => setSelectedDepts(selected.map(opt => opt.value))}
						styles={multiSelectDarkTheme}
					/>
				</div>
			</div>

			{/* Row 3: Event + Status + Scanner */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
				<div style={{ flex: 1, minWidth: "200px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Event (REQUIRED)</label>
					<Select
						required
						options={eventOptions}
						value={eventOptions.find(e => e.value === selectedEvent) || null}
						onChange={(opt) => setSelectedEvent(opt ? opt.value : null)}
						isClearable
						styles={multiSelectDarkTheme}
					/>
				</div>
				<div style={{ flex: 1, minWidth: "200px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Status</label>
					<Select
						options={[
							{ value: "accepted", label: "Accepted" },
							{ value: "rejected", label: "Rejected" },
							{ value: "no-scan", label: "No Scan" },
							{ value: "absent", label: "Absent" }
						]}
						value={
							statusFilter
								? { value: statusFilter, label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) }
								: null
						}
						onChange={(opt) => setStatusFilter(opt ? opt.value : null)}
						isClearable
						styles={multiSelectDarkTheme}
					/>
				</div>
				<div style={{ flex: 1, minWidth: "200px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Scanner</label>
					<Select
						options={scannerOptions}
						value={scannerOptions.find(s => s.value === selectedScanner) || null}
						onChange={(opt) => setSelectedScanner(opt ? opt.value : null)}
						isClearable
						styles={multiSelectDarkTheme}
					/>
				</div>
			</div>

			{/* Row 4: Time From + Time To */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
				<div style={{ flex: 1, minWidth: "180px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Time From</label>
					<input
						type="datetime-local"
						value={timeFrom}
						onChange={(e) => setTimeFrom(e.target.value)}
						style={{ padding: "0.5rem", width: "100%" }}
					/>
				</div>
				<div style={{ flex: 1, minWidth: "180px" }}>
					<label style={{ display: "block", marginBottom: "0.25rem" }}>Time To</label>
					<input
						type="datetime-local"
						value={timeTo}
						onChange={(e) => setTimeTo(e.target.value)}
						style={{ padding: "0.5rem", width: "100%" }}
					/>
				</div>
			</div>

			<button
				onClick={() => {
					if(!selectedEvent) {
						alert("Please select an event before searching!");
						return;
					}
					setPage(0);
					fetchData();
				}}
				style={{ padding: "0.5rem 1rem", background: "#444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
			>
				Search
			</button>

			{/* Table */}
			<table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%", marginTop: '1rem' }}>
				<thead>
					<tr style={{ background: "#333" }}>
						<th>Name</th>
						<th>Student #</th>
						<th>Year</th>
						<th>Department</th>
						<th>Status</th>
						<th>Scanner</th>
						<th>Timestamp</th>
						<th>Event ID</th>
					</tr>
				</thead>
				<tbody>
					{items.map((s) => {
						let borderColor = "transparent";
						if (s.status === "accepted") borderColor = "#2e7d32";
						else if (s.status === "rejected") borderColor = "#c62828";
						else if (s.status === "no-scan" || s.status === "absent") borderColor = "#ef6c00";

						return (
							<tr key={s.id} style={{ borderLeft: `6px solid ${borderColor}`, background: "#222", color: "#fff" }}>
								<td>{s.name}</td>
								<td>{s.studentNumber}</td>
								<td>{s.yearName}</td>
								<td>{s.departmentName}</td>
								<td>{s.status}</td>
								<td>{s.scannerId || "—"}</td>
								<td>{formatTimestamp(s.timestamp)}</td>
								<td>{s.eventId || "—"}</td>
							</tr>
						);
					})}
				</tbody>
			</table>


			{/* Pagination (centered like Students page) */}
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					marginTop: "1rem",
					gap: "0.5rem",
				}}
			>
				<button disabled={page <= 0} onClick={() => setPage(page - 1)}>Prev</button>
				<span>Page {page + 1} of {totalPages}</span>
				<button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
			</div>
		</div>
	);
}
