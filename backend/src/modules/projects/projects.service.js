const {
    getProjects,
    getActiveProjects,
    getProjectById,
    getSubtasksByProject,
    createSubtaskRecord,
    updateSubtaskRecord,
    updateProjectRecord,
    findProjectOwner,
    getProjectResources,
    createProjectRecord,
    getProjectDependencies,
    createProjectDependencyRecord,
    getProjectSubtaskForDependency,
} = require('./projects.model');

const normalizeSubtaskStatus = (status) => {
    if (!status || typeof status !== 'string') return null;
    const s = status.trim().toLowerCase();
    if (s === 'todo' || s === 'pending') return 'PENDING';
    if (s === 'in_progress' || s === 'in progress' || s === 'doing') return 'IN_PROGRESS';
    if (s === 'done' || s === 'completed') return 'COMPLETED';
    const upper = status.trim().toUpperCase();
    if (['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(upper)) return upper;
    return null;
};

const calculateCompletionPercentage = (subtasks = []) => {
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
        return 0;
    }

    const completed = subtasks.filter(
        (subtask) => subtask?.status === 'COMPLETED'
    ).length;

  return Math.round((completed / subtasks.length) * 100);
};

const getAllProjects = async (options = {}) => {
    const projects = await getProjects(options);

    return projects.map((project) => ({
        ...project,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    }));
};

const getActiveProjectsData = async (options = {}) => {
    const projects = await getActiveProjects(options);

    return projects.map((project) => ({
        ...project,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    }));
};

const getProjectDetail = async (projectId, organisationId = null) => {
    const project = await getProjectById(projectId, organisationId);

    if (!project) return null;

    return {
        ...project,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    };
};

const getProjectSubtasks = async (projectId, organisationId = null) => {
    return getSubtasksByProject(projectId, organisationId);
};

const createProjectSubtask = async (projectId, organisationId, subtaskData) => {
    if (!projectId || !organisationId) {
        throw new Error('Project and organisation are required');
    }
    if (!subtaskData || typeof subtaskData !== 'object') {
        throw new Error('Subtask data is required');
    }
    const { title, status = 'PENDING', assigneeId, assignee, dueDate, dependsOnTaskId, hoursEstimate } = subtaskData;
    if (typeof title !== 'string' || !title.trim()) {
        throw new Error('Subtask title is required');
    }
    if (title.trim().length > 255) {
        throw new Error('Subtask title cannot exceed 255 characters');
    }
    const normalizedStatus = normalizeSubtaskStatus(status);
    if (!normalizedStatus) {
        throw new Error('Subtask status must be one of: todo, in_progress, done (or PENDING, IN_PROGRESS, COMPLETED)');
    }

    const project = await getProjectDetail(projectId, organisationId);
    if (!project) {
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }

    return createSubtaskRecord({
        projectId,
        title: title.trim(),
        status: normalizedStatus,
        assigneeId: assigneeId || assignee || null,
        dueDate: dueDate || null,
        dependsOnTaskId: dependsOnTaskId || null,
        hoursEstimate: hoursEstimate !== undefined ? Number(hoursEstimate) : null,
    });
};

const updateProjectSubtask = async (projectId, subtaskId, organisationId, patch = {}) => {
    if (!projectId || !subtaskId || !organisationId) {
        throw new Error('Project ID, subtask ID, and organisation are required');
    }

    const project = await getProjectDetail(projectId, organisationId);
    if (!project) {
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }

    const cleanPatch = {};

    if (patch.status !== undefined) {
        const norm = normalizeSubtaskStatus(patch.status);
        if (!norm) {
            throw new Error('Subtask status must be one of: todo, in_progress, done (or PENDING, IN_PROGRESS, COMPLETED)');
        }
        cleanPatch.status = norm;
    }

    if (patch.done !== undefined) {
        cleanPatch.status = Boolean(patch.done) ? 'COMPLETED' : 'PENDING';
    }

    if (patch.title !== undefined) {
        if (typeof patch.title !== 'string' || !patch.title.trim()) {
            throw new Error('Subtask title cannot be empty');
        }
        if (patch.title.trim().length > 255) {
            throw new Error('Subtask title cannot exceed 255 characters');
        }
        cleanPatch.title = patch.title.trim();
    }

    if (patch.assignee !== undefined || patch.assigneeId !== undefined) {
        cleanPatch.assigneeId = patch.assigneeId || patch.assignee || null;
    }

    if (patch.dueDate !== undefined) {
        cleanPatch.dueDate = patch.dueDate;
    }

    const updatedSubtask = await updateSubtaskRecord(projectId, subtaskId, organisationId, cleanPatch);
    if (!updatedSubtask) {
        const error = new Error('Subtask not found in project');
        error.code = 'SUBTASK_NOT_FOUND';
        throw error;
    }

    const allSubtasks = await getSubtasksByProject(projectId, organisationId);
    const completionPercentage = calculateCompletionPercentage(allSubtasks);

    return {
        subtask: updatedSubtask,
        completionPercentage,
    };
};

const updateProject = async (projectId, organisationId, patch = {}) => {
    if (!projectId || !organisationId) {
        throw new Error('Project ID and organisation are required');
    }

    const existing = await getProjectDetail(projectId, organisationId);
    if (!existing) {
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }

    const cleanPatch = {};
    const nameOrTitle = patch.name || patch.title;
    if (nameOrTitle !== undefined) {
        if (typeof nameOrTitle !== 'string' || !nameOrTitle.trim()) {
            throw new Error('Project title cannot be empty');
        }
        if (nameOrTitle.trim().length > 255) {
            throw new Error('Project title cannot exceed 255 characters');
        }
        cleanPatch.name = nameOrTitle.trim();
    }

    if (patch.description !== undefined) {
        if (patch.description && (typeof patch.description !== 'string' || patch.description.length > 10000)) {
            throw new Error('Description cannot exceed 10000 characters');
        }
        cleanPatch.description = patch.description || null;
    }

    if (patch.status !== undefined) {
        cleanPatch.status = String(patch.status).toUpperCase();
    }

    if (patch.priority !== undefined) {
        cleanPatch.priority = String(patch.priority).toUpperCase();
    }

    if (patch.startDate !== undefined) {
        cleanPatch.startDate = patch.startDate;
    }

    const targetEnd = patch.targetEndDate || patch.targetDate || patch.endDate;
    if (targetEnd !== undefined) {
        cleanPatch.endDate = targetEnd;
    }

    if (patch.hoursBudget !== undefined || patch.budgetHours !== undefined) {
        const b = patch.hoursBudget !== undefined ? patch.hoursBudget : patch.budgetHours;
        cleanPatch.hoursBudget = b !== null ? Number(b) : null;
    }

    if (patch.progressPercentage !== undefined || patch.progress !== undefined) {
        const p = patch.progressPercentage !== undefined ? patch.progressPercentage : patch.progress;
        cleanPatch.progressPercentage = Number(p);
    }

    const updated = await updateProjectRecord(projectId, organisationId, cleanPatch);
    return {
        ...updated,
        completionPercentage: calculateCompletionPercentage(updated.subtasks),
    };
};

const createProject = async (projectData) => {
    if (!projectData || typeof projectData !== 'object') {
        throw new Error('Project data is required');
    }

    const title = projectData.title || projectData.name;
    const targetEndDate = projectData.targetEndDate || projectData.targetDate || projectData.endDate;
    const ownerId = projectData.ownerId || projectData.owner;
    const {
        organisationId,
        description,
        status,
        priority,
        startDate,
        hoursBudget,
    } = projectData;

    if (!organisationId) {
        throw new Error('Organisation is required');
    }

    if (typeof title !== 'string' || !title.trim()) {
        throw new Error('Project title is required');
    }

    if (title.trim().length > 255) {
        throw new Error('Project title cannot exceed 255 characters');
    }

    if (description !== undefined && description !== null) {
        if (typeof description !== 'string' || description.length > 10000) {
            throw new Error('Description cannot exceed 10000 characters');
        }
    }

    const code = projectData.code?.trim() || `PRJ-${title.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    if (status !== undefined && typeof status !== 'string') {
        throw new Error('Invalid project status');
    }

    if (priority !== undefined && typeof priority !== 'string') {
        throw new Error('Invalid project priority');
    }

    const validDate = (value) => {
        return value === undefined || value === null ||
        (typeof value === 'string' && !Number.isNaN(Date.parse(value)));
    };

    if (!validDate(startDate) || !validDate(targetEndDate)) {
        throw new Error('Invalid project date');
    }

    if (startDate && targetEndDate &&
        new Date(targetEndDate) < new Date(startDate)) {
        throw new Error('Target end date cannot be before start date');
    }

    if (ownerId !== undefined && ownerId !== null) {
        if (typeof ownerId !== 'string' || !ownerId.trim()) {
            throw new Error('Invalid project owner');
        }

        const owner = await findProjectOwner(ownerId.trim(), organisationId);

        if (!owner) {
            throw new Error('Project owner not found in this organisation');
        }
    }

    const project = await createProjectRecord({
        ...projectData,
        title: title.trim(),
        code,
        organisationId,
        ownerId: ownerId?.trim() || null,
        hoursBudget: hoursBudget !== undefined ? Number(hoursBudget) : null,
    });

    return {
        ...project,
        targetEndDate: project.endDate
            ? new Date(project.endDate).toISOString().slice(0, 10)
            : null,
        completionPercentage: calculateCompletionPercentage(project.subtasks),
    };
};


const dependencyTypes = [
    'FINISH_TO_START',
    'START_TO_START',
    'FINISH_TO_FINISH',
    'START_TO_FINISH',
];

const hasDependencyPath = (startId, targetId, dependencies) => {
    const graph = new Map();

    for (const dependency of dependencies) {
        if (!graph.has(dependency.subtaskId)) {
        graph.set(dependency.subtaskId, []);
        }

        graph.get(dependency.subtaskId).push(
        dependency.dependsOnSubtaskId
        );
    }

    const visited = new Set();

    const visit = (currentId) => {
        if (currentId === targetId) return true;
        if (visited.has(currentId)) return false;

        visited.add(currentId);

        const prerequisites = graph.get(currentId) || [];

        return prerequisites.some(visit);
    };

    return visit(startId);
};

const getProjectDependenciesData = async (projectId, organisationId) => {
    if (!projectId || !organisationId) {
        throw new Error('Project and organisation are required');
    }

    const dependencies = await getProjectDependencies(
        projectId,
        organisationId
    );

    if (dependencies === null) {
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }

    return dependencies;
};

const createProjectDependency = async (
    projectId,
    organisationId,
    dependencyData
    ) => {
    if (!projectId || !organisationId) {
        throw new Error('Project and organisation are required');
    }

    if (
        !dependencyData ||
        typeof dependencyData !== 'object' ||
        Array.isArray(dependencyData)
    ) {
        throw new Error('Dependency data is required');
    }

    const {
        subtaskId,
        dependsOnSubtaskId,
        dependencyType = 'FINISH_TO_START',
        lagTime = 0,
    } = dependencyData;

    if (
        typeof subtaskId !== 'string' ||
        !subtaskId.trim() ||
        typeof dependsOnSubtaskId !== 'string' ||
        !dependsOnSubtaskId.trim()
    ) {
        throw new Error('Both subtask IDs are required');
    }

    const normalizedSubtaskId = subtaskId.trim();
    const normalizedDependsOnSubtaskId = dependsOnSubtaskId.trim();

    if (normalizedSubtaskId === normalizedDependsOnSubtaskId) {
        throw new Error('A subtask cannot depend on itself');
    }

    if (!dependencyTypes.includes(dependencyType)) {
        throw new Error('Invalid dependency type');
    }

    if (!Number.isInteger(lagTime) || lagTime < 0) {
        throw new Error('Lag time must be a non-negative integer');
    }

    const existingDependencies = await getProjectDependencies(
        projectId,
        organisationId
    );

    if (existingDependencies === null) {
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }

    const [subtask, prerequisite] = await Promise.all([
        getProjectSubtaskForDependency(
        normalizedSubtaskId,
        projectId
        ),
        getProjectSubtaskForDependency(
        normalizedDependsOnSubtaskId,
        projectId
        ),
    ]);

    if (!subtask || !prerequisite) {
        throw new Error('Both subtasks must belong to the specified project');
    }

    const existingDependency = existingDependencies.some(
        (dependency) =>
        dependency.subtaskId === normalizedSubtaskId &&
        dependency.dependsOnSubtaskId === normalizedDependsOnSubtaskId
    );

    if (
        hasDependencyPath(
        normalizedDependsOnSubtaskId,
        normalizedSubtaskId,
        existingDependencies
        )
    ) {
        throw new Error('Circular dependency is not allowed');
    }

    const dependency = await createProjectDependencyRecord({
        subtaskId: normalizedSubtaskId,
        dependsOnSubtaskId: normalizedDependsOnSubtaskId,
        dependencyType,
        lagTime,
    });

    return {
        operation: existingDependency ? 'UPDATED' : 'CREATED',
        dependency,
    };
};

const getProjectResourcesData = async (projectId, organisationId = null) => {
    if (
        typeof projectId !== 'string' ||
        !projectId.trim()
    ) {
        throw new Error('Valid project ID is required');
    }

    const assignments = await getProjectResources(
        projectId.trim(),
        organisationId
    );

    if (assignments === null) {
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }

    return assignments.map((assignment) => {
        const {
        allocatedHours,
        capacityHours,
        } = assignment;

        const utilisation = capacityHours > 0
        ? Number(((allocatedHours / capacityHours) * 100).toFixed(2))
        : null;

        return {
        id: assignment.id,
        user: assignment.user,
        allocatedHours,
        capacityHours,
        capacityUtilisationPercentage: utilisation,
        remainingCapacityHours: capacityHours - allocatedHours,
        isOverAllocated: capacityHours >= 0 && allocatedHours > capacityHours,
        };
    });
};


module.exports = {
    getAllProjects,
    getActiveProjectsData,
    getProjectDetail,
    getProjectSubtasks,
    createProjectSubtask,
    updateProjectSubtask,
    createProject,
    updateProject,
    getProjectDependenciesData,
    createProjectDependency,
    getProjectResourcesData,
};