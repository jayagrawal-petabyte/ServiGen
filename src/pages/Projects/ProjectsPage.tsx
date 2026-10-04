import { useMemo, useState } from "react";
import { mockProjects, Project } from "./mockProjects";
import "./projects.css";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return mockProjects.filter((project) => {
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
  }, [search, statusFilter, priorityFilter]);

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and track all projects</p>
        </div>

        <button className="add-project-btn">+ New Project</button>
      </div>

      <div className="project-summary">
        <div className="summary-card">
          <span>Total Projects</span>
          <strong>{mockProjects.length}</strong>
        </div>

        <div className="summary-card">
          <span>Active</span>
          <strong>
            {mockProjects.filter((p) => p.status === "Active").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>Completed</span>
          <strong>
            {mockProjects.filter((p) => p.status === "Completed").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>On Hold</span>
          <strong>
            {mockProjects.filter((p) => p.status === "On Hold").length}
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
    </div>
  );
}