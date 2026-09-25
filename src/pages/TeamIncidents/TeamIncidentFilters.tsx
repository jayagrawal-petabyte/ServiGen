interface TeamIncidentFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  priority: string;
  setPriority: (value: string) => void;
}

function TeamIncidentFilters({
  search,
  setSearch,
  status,
  setStatus,
  priority,
  setPriority,
}: TeamIncidentFiltersProps) {
  return (
    <div className="team-incident-filters">
      <input
        type="text"
        placeholder="Search incidents..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="All">All Status</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Pending">Pending</option>
      </select>

      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
      >
        <option value="All">All Priority</option>
        <option value="Critical">Critical</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>
  );
}

export default TeamIncidentFilters;