'use strict';

const knowledgeModel = require('./knowledge.model');

const listArticles = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const articles = await knowledgeModel.getArticles(filter);
    return res.status(200).json({
      success: true,
      data: articles,
    });
  } catch (err) {
    next(err);
  }
};

const getArticle = async (req, res, next) => {
  try {
    const article = await knowledgeModel.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (err) {
    next(err);
  }
};

const createArticle = async (req, res, next) => {
  try {
    const { title, content, category, priority, status } = req.body || {};
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'title is required',
      });
    }
    const created = await knowledgeModel.createArticle({
      title,
      content: content || '',
      category: category || 'General',
      priority: priority || 'Medium',
      status: status || 'Draft',
      authorId: req.user.id,
    });
    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const updated = await knowledgeModel.updateArticle(req.params.id, req.body || {});
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
};
