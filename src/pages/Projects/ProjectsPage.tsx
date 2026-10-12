import { useMemo, useState } from "react";
import { mockProjects, Project } from "./mockProjects";
import "./projects.css";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New project form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOwner, setNewOwner] = useState("Inesh Agarwal");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.owner.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || project.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, search, statusFilter, priorityFilter]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created: Project = {
      id: Date.now(),
      name: newName.trim(),
      description: newDesc.trim() || "New project workspace",
      status: "Active",
      priority: newPriority,
      owner: newOwner.trim() || "Inesh Agarwal",
      timeline: "Q4 2026",
      completedSubtasks: 0,
      totalSubtasks: 5,
      timeSpent: "0h",
    };

    setProjects((prev) => [created, ...prev]);
    setNewName("");
    setNewDesc("");
    setIsCreateOpen(false);
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and track all projects</p>
        </div>

        <button
          className="add-project-btn"
          onClick={() => setIsCreateOpen(true)}
        >
          + New Project
        </button>
      </div>

      <div className="project-summary">
        <div className="summary-card">
          <span>Total Projects</span>
          <strong>{projects.length}</strong>
        </div>

        <div className="summary-card">
          <span>Active</span>
          <strong>
            {projects.filter((p) => p.status === "Active").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>Completed</span>
          <strong>
            {projects.filter((p) => p.status === "Completed").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>On Hold</span>
          <strong>
            {projects.filter((p) => p.status === "On Hold").length}
          </strong>
        </div>
      </div>

      <div className="projects-toolbar">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div className="project-card" key={project.id}>
              <div className="project-card-header">
                <div>
                  <h2>{project.name}</h2>
                  <span className={`status ${project.status.toLowerCase().replace(" ", "-")}`}>
                    {project.status}
                  </span>
                </div>

                <span
                  className={`priority ${project.priority.toLowerCase()}`}
                >
                  {project.priority}
                </span>
              </div>

              <p className="project-description">{project.description}</p>

              <div className="project-info">
                <div>
                  <span>Owner</span>
                  <strong>{project.owner}</strong>
                </div>

                <div>
                  <span>Timeline</span>
                  <strong>{project.timeline}</strong>
                </div>
              </div>

              <div className="project-progress">
                <div className="progress-heading">
                  <span>Progress</span>
                  <strong>
                    {project.completedSubtasks}/{project.totalSubtasks}
                  </strong>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (project.completedSubtasks /
                          project.totalSubtasks) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="project-footer">
                <span>{project.timeSpent}</span>

                <button
                  className="view-btn"
                  onClick={() => setSelectedProject(project)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedProject && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="project-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedProject.name}</h2>

              <button
                className="close-btn"
                onClick={() => setSelectedProject(null)}
              >
                ×
              </button>
            </div>

            <p>{selectedProject.description}</p>

            <div className="modal-details">
              <div>
                <span>Status</span>
                <strong>{selectedProject.status}</strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>{selectedProject.priority}</strong>
              </div>

              <div>
                <span>Owner</span>
                <strong>{selectedProject.owner}</strong>
              </div>

              <div>
                <span>Timeline</span>
                <strong>{selectedProject.timeline}</strong>
              </div>

              <div>
                <span>Time Spent</span>
                <strong>{selectedProject.timeSpent}</strong>
              </div>

              <div>
                <span>Subtasks</span>
                <strong>
                  {selectedProject.completedSubtasks}/
                  {selectedProject.totalSubtasks}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="project-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                className="close-btn"
                onClick={() => setIsCreateOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ERP Cloud Migration"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Goals, deliverables and scope..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Owner
                  </label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "High" | "Medium" | "Low")}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}