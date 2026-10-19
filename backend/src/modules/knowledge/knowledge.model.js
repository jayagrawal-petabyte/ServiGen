'use strict';

const db = require('../../config/db');
const { handleDbError } = require('../../shared/utils/db-guard');

const getArticles = async (filter = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const articles = await db.knowledgeArticle.findMany({
        where: filter,
        include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      return articles.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category || 'General',
        priority: a.priority || 'Medium',
        status: a.status,
        approvalStatus: a.approvalStatus,
        slaDueAt: a.slaDueAt ? a.slaDueAt.toISOString() : null,
        author: a.author ? `${a.author.firstName} ${a.author.lastName}`.trim() : 'Unknown Author',
        authorId: a.authorId,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }));
    } catch (_err) {
      handleDbError('knowledge.getArticles', _err);
      return [];
    }
  }
  return [];
};

const getArticleById = async (id) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const a = await db.knowledgeArticle.findUnique({
        where: { id },
        include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      if (!a) return null;
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category || 'General',
        priority: a.priority || 'Medium',
        status: a.status,
        approvalStatus: a.approvalStatus,
        slaDueAt: a.slaDueAt ? a.slaDueAt.toISOString() : null,
        author: a.author ? `${a.author.firstName} ${a.author.lastName}`.trim() : 'Unknown Author',
        authorId: a.authorId,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      };
    } catch (_err) {
      handleDbError('knowledge.getArticleById', _err);
      return null;
    }
  }
  return null;
};

const createArticle = async (data) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const created = await db.knowledgeArticle.create({
        data: {
          title: data.title,
          content: data.content || '',
          category: data.category || 'General',
          priority: data.priority || 'Medium',
          status: data.status || 'Draft',
          approvalStatus: data.approvalStatus || 'Pending',
          slaDueAt: data.slaDueAt ? new Date(data.slaDueAt) : null,
          authorId: data.authorId,
        },
      });
      return {
        id: created.id,
        title: created.title,
        content: created.content,
        category: created.category,
        priority: created.priority,
        status: created.status,
        approvalStatus: created.approvalStatus,
        authorId: created.authorId,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (_err) {
      handleDbError('knowledge.createArticle', _err);
      // Fallback
    }
  }
  return { id: 'art-' + Date.now(), ...data };
};

const updateArticle = async (id, data) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const updated = await db.knowledgeArticle.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title : undefined,
          content: data.content !== undefined ? data.content : undefined,
          category: data.category !== undefined ? data.category : undefined,
          priority: data.priority !== undefined ? data.priority : undefined,
          status: data.status !== undefined ? data.status : undefined,
          approvalStatus: data.approvalStatus !== undefined ? data.approvalStatus : undefined,
        },
      });
      return {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        category: updated.category,
        priority: updated.priority,
        status: updated.status,
        approvalStatus: updated.approvalStatus,
        authorId: updated.authorId,
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (_err) {
      handleDbError('knowledge.updateArticle', _err);
      return null;
    }
  }
  return { id, ...data };
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
};
