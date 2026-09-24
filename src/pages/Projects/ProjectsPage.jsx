import React, { useMemo, useState } from 'react';
import { INITIAL_PROJECTS } from './mockProjects';
import './projects.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('all');

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesTab =
        currentTab === 'all' || project.status === currentTab;

      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [projects, searchQuery, currentTab]);

  const activeCount = projects.filter(
    (project) => project.status === 'active'
  ).length;

  const completedCount = projects.filter(
    (project) => project.status === 'completed'
  ).length;

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>View and manage your projects</p>
        </div>
      </div>

      <div className="projects-toolbar">
        <div className="project-tabs">
          <button
            className={currentTab === 'all' ? 'active' : ''}
            onClick={() => setCurrentTab('all')}
          >
            All ({projects.length})
          </button>

          <button
            className={currentTab === 'active' ? 'active' : ''}
            onClick={() => setCurrentTab('active')}
          >
            Active ({activeCount})
          </button>

          <button
            className={currentTab === 'completed' ? 'active' : ''}
            onClick={() => setCurrentTab('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="projects-search">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="projects-empty">
          <h3>No projects found</h3>
          <p>Try changing your search or filter.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div className="project-card" key={project.id}>
              <div className="project-card-header">
                <div>
                  <h2>{project.name}</h2>
                  <p>{project.description}</p>
                </div>

                <span className={`project-status ${project.status}`}>
                  {project.status}
                </span>
              </div>

              <div className="project-progress">
                <div className="progress-label">
                  <span>Completion</span>
                  <strong>{project.completion}%</strong>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${project.completion}%` }}
                  />
                </div>
              </div>

              <div className="project-details">
                <div>
                  <span>Timeline</span>
                  <strong>{project.timeline}</strong>
                </div>

                <div>
                  <span>Time Spent</span>
                  <strong>{project.timeSpent}</strong>
                </div>

                <div>
                  <span>Subtasks</span>
                  <strong>
                    {project.completedSubtasks}/{project.totalSubtasks}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}