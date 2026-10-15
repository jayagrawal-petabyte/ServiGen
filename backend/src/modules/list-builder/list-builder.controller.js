const {
  getAllLists,
  getList,
  createNewList,
} = require('./list-builder.service');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string') {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getLists = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const lists = await getAllLists({ organisationId });

    res.status(200).json({
      success: true,
      data: lists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lists',
    });
  }
};

const getListById = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid list ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const list = await getList(id.trim(), organisationId);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch list',
    });
  }
};

const createList = async (req, res) => {
  try {
    const {
      name,
      description,
      fields,
      status,
      createdBy,
    } = req.body || {};

    // BI-15: Validate list name
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name must be a non-empty string',
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Name must not exceed 150 characters',
      });
    }

    // BI-15: Validate fields array and field entries
    if (
      !Array.isArray(fields) ||
      fields.length === 0 ||
      fields.length > 50 ||
      fields.some(
        (field) =>
          typeof field !== 'string' || field.trim() === '' || field.trim().length > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Fields must be a non-empty array of non-empty strings',
      });
    }

    // BI-16: Enforce server-controlled creator identity (prevent identity spoofing)
    const isPrivileged = req.user && req.user.role === 'Admin';
    const effectiveCreatedBy = (isPrivileged && typeof createdBy === 'string' && createdBy.trim())
      ? createdBy.trim()
      : (req.user?.id || req.headers['x-user-id'] || 'User');

    const allowedStatuses = ['Draft', 'Published', 'Archived'];
    const sanitizedStatus = allowedStatuses.includes(status) ? status : 'Draft';
    const sanitizedDesc = typeof description === 'string' ? description.slice(0, 500) : null;
    const organisationId = req.user?.organisationId || req.headers['x-org-id'] || 'org-001';

    const newList = await createNewList({
      name: name.trim(),
      description: sanitizedDesc,
      fields: fields.map((f) => f.trim()),
      status: sanitizedStatus,
      createdBy: effectiveCreatedBy,
      organisationId,
    });

    return res.status(201).json({
      success: true,
      data: newList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create list',
    });
  }
};

module.exports = {
  getLists,
  getListById,
  createList,
};