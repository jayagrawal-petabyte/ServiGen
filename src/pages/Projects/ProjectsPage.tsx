import { useMemo, useState, useEffect } from "react";
import { Project } from "./mockProjects";
import { getAllProjects } from "./projectsApi";
import "./projects.css";

const emptyForm = {
  name: "",
  description: "",
  status: "Active" as Project["status"],
  priority: "Medium" as Project["priority"],
  owner: "",
  timeline: "",
  timeSpent: "0 hours",
  completedSubtasks: 0,
  totalSubtasks: 1,
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
  async function fetchProjects() {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      const { mockProjects } = await import("./mockProjects");
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  }
  fetchProjects();
}, []);

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
  }, [search, statusFilter, priorityFilter, projects]);

  function handleAddProject() {
    if (!form.name.trim() || !form.owner.trim()) return;
    const newProject: Project = {
      ...form,
      id: projects.length + 1,
    };
    setProjects([...projects, newProject]);
    setShowAddModal(false);
    setForm(emptyForm);
  }
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: '#64748b', fontSize: '16px' }}>Loading projects...</p>
    </div>
  );
  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and track all projects</p>
        </div>
        <button
          className="add-project-btn"
          onClick={() => setShowAddModal(true)}
        >
          + New Project
        </button>
      </div>

      <div className="project-summary">
        <div className="summary-card">
          <span>Total Projects</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="summary-card active">
          <span>Active</span>
          <strong>{projects.filter((p) => p.status === "Active").length}</strong>
        </div>
        <div className="summary-card completed">
          <span>Completed</span>
          <strong>
            {projects.filter((p) => p.status === "Completed").length}
          </strong>
        </div>
        <div className="summary-card onhold">
          <span>On Hold</span>
          <strong>
            {projects.filter((p) => p.status === "On Hold").length}
          </strong>
        </div>
      </div>

      <div className="projects-toolbar">
        <input
          type="text"
          placeholder="🔍 Search projects..."
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
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <h3>No projects found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div className="project-card" key={project.id}>
              <div className="project-card-header">
                <div>
                  <h2>{project.name}</h2>
                  <span
                    className={`status ${project.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {project.status}
                  </span>
                </div>
                <span className={`priority ${project.priority.toLowerCase()}`}>
                  {project.priority}
                </span>
              </div>

              <p className="project-description">{project.description}</p>

              <div className="project-info">
                <div>
                  <span>👤 Owner</span>
                  <strong>{project.owner}</strong>
                </div>
                <div>
                  <span>📅 Timeline</span>
                  <strong>{project.timeline}</strong>
                </div>
              </div>

              <div className="project-progress">
                <div className="progress-heading">
                  <span>Progress</span>
                  <strong>
                    {project.completedSubtasks}/{project.totalSubtasks} subtasks
                  </strong>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (project.completedSubtasks / project.totalSubtasks) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="progress-percent">
                  {Math.round(
                    (project.completedSubtasks / project.totalSubtasks) * 100
                  )}
                  %
                </span>
              </div>

              <div className="project-footer">
                <span>⏱ {project.timeSpent}</span>
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

      {/* VIEW DETAILS MODAL */}
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
            <p style={{ color: "#64748b", marginBottom: "20px" }}>
              {selectedProject.description}
            </p>
            <div className="modal-details">
              <div>
                <span>Status</span>
                <strong
                  className={`status ${selectedProject.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {selectedProject.status}
                </strong>
              </div>
              <div>
                <span>Priority</span>
                <strong
                  className={`priority ${selectedProject.priority.toLowerCase()}`}
                >
                  {selectedProject.priority}
                </strong>
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
            <div className="project-progress" style={{ marginTop: "20px" }}>
              <div className="progress-heading">
                <span>Overall Progress</span>
                <strong>
                  {Math.round(
                    (selectedProject.completedSubtasks /
                      selectedProject.totalSubtasks) *
                      100
                  )}
                  %
                </strong>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      (selectedProject.completedSubtasks /
                        selectedProject.totalSubtasks) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="project-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>New Project</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="add-form">
              <label>Project Name *</label>
              <input
                placeholder="Enter project name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <label>Description</label>
              <textarea
                placeholder="Enter description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <label>Owner *</label>
              <input
                placeholder="Enter owner name"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />

              <label>Timeline</label>
              <input
                placeholder="e.g. Oct 1 - Nov 30"
                value={form.timeline}
                onChange={(e) =>
                  setForm({ ...form, timeline: e.target.value })
                }
              />

              <div className="form-row">
                <div>
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as Project["status"],
                      })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as Project["priority"],
                      })
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label>Total Subtasks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalSubtasks}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        totalSubtasks: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label>Completed Subtasks</label>
                  <input
                    type="number"
                    min="0"
                    value={form.completedSubtasks}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        completedSubtasks: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <button
                className="add-project-btn"
                style={{ width: "100%", marginTop: "8px" }}
                onClick={handleAddProject}
              >
                ✅ Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}