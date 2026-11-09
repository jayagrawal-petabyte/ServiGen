const {
    getProjects,
    getActiveProjects,
    getProjectById,
    getSubtasksByProject,
    createSubtaskRecord,
    findProjectOwner,
    getProjectResources,
    createProjectRecord,
    getProjectDependencies,
    createProjectDependencyRecord,
    getProjectSubtaskForDependency,
} = require('./projects.model');

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
    const { title, status = 'PENDING' } = subtaskData;
    if (typeof title !== 'string' || !title.trim()) {
        throw new Error('Subtask title is required');
    }
    if (title.trim().length > 255) {
        throw new Error('Subtask title cannot exceed 255 characters');
    }
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Subtask status must be one of: ${validStatuses.join(', ')}`);
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
        status,
    });
};

const createProject = async (projectData) => {
    if (!projectData || typeof projectData !== 'object') {
        throw new Error('Project data is required');
    }

    const {
        organisationId,
        title,
        description,
        code,
        status,
        priority,
        startDate,
        targetEndDate,
        ownerId,
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

    if (code !== undefined && code !== null) {
        if (typeof code !== 'string' || !code.trim() || code.length > 50) {
        throw new Error('Invalid project code');
        }
    }

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
    code: code?.trim() || null,
    organisationId,
    ownerId: ownerId?.trim() || null,
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
    createProject,
    getProjectDependenciesData,
    createProjectDependency,
    getProjectResourcesData,
};