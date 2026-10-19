'use strict';

const express = require('express');
const router = express.Router();
const { prisma } = require('../../shared');

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.user && req.user.role !== 'Admin' && req.user.organisationId) {
      where.organisationId = req.user.organisationId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        networkLogin: true,
        availability: true,
        role: true,
        organisationId: true,
        siteId: true,
        site: { select: { name: true } },
        organisation: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    const adapted = users.map(u => ({
      id: u.id,
      username: u.username || u.email.split('@')[0],
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      phone: u.phoneNumber || '+44 20 7946 0912',
      networkLogin: u.networkLogin || `CORP\\${u.username || u.id}`,
      defaultSite: u.site?.name || 'London HQ - Floor 3',
      defaultOrganisation: u.organisation?.name || u.organisationId || 'Apex Global',
      region: 'EMEA',
      role: u.role,
      status: 'Active',
      lastLogin: u.updatedAt ? u.updatedAt.toISOString() : new Date().toISOString(),
    }));

    res.status(200).json({ success: true, data: adapted });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        networkLogin: true,
        availability: true,
        role: true,
        organisationId: true,
        siteId: true,
        site: { select: { name: true } },
        organisation: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: `User ${id} not found` });
    }

    const adapted = {
      id: user.id,
      username: user.username || user.email.split('@')[0],
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phoneNumber || '+44 20 7946 0912',
      networkLogin: user.networkLogin || `CORP\\${user.username || user.id}`,
      defaultSite: user.site?.name || 'London HQ - Floor 3',
      defaultOrganisation: user.organisation?.name || user.organisationId || 'Apex Global',
      region: 'EMEA',
      role: user.role,
      status: 'Active',
      lastLogin: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: adapted });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
