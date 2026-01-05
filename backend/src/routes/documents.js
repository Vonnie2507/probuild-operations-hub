/**
 * PROBUILD OPERATIONS HUB
 * Live Document Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, query, validationResult } = require('express-validator');
const { jobman } = require('../services/jobman');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// LIST ALL DOCUMENTS
// ============================================

router.get('/', 
  query('status').optional().isIn(['LEAD', 'QUOTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const { status, search, page = 1, limit = 20 } = req.query;
      
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { siteAddress: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [documents, total] = await Promise.all([
        prisma.liveDocument.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit),
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { files: true, changes: true }
            }
          }
        }),
        prisma.liveDocument.count({ where })
      ]);

      res.json({
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET SINGLE DOCUMENT
// ============================================

router.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const document = await prisma.liveDocument.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          files: {
            orderBy: { uploadedAt: 'desc' }
          },
          changes: {
            orderBy: { changedAt: 'desc' },
            take: 50,
            include: {
              changedBy: {
                select: { id: true, name: true }
              }
            }
          },
          communications: {
            orderBy: { receivedAt: 'desc' }
          }
        }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // If linked to Jobman, fetch fresh data
      let jobmanData = null;
      if (document.jobmanLeadId) {
        try {
          jobmanData = await jobman.getLead(document.jobmanLeadId);
        } catch (e) {
          console.warn('Could not fetch Jobman lead:', e.message);
        }
      } else if (document.jobmanJobId) {
        try {
          jobmanData = await jobman.getJob(document.jobmanJobId);
        } catch (e) {
          console.warn('Could not fetch Jobman job:', e.message);
        }
      }

      res.json({ 
        document,
        jobmanData 
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// CREATE NEW DOCUMENT
// ============================================

router.post('/',
  body('customerName').notEmpty().trim(),
  body('customerEmail').optional().isEmail(),
  body('customerPhone').optional().isString(),
  body('siteAddress').optional().isString(),
  body('linkToJobman').optional().isBoolean(),
  body('jobmanLeadId').optional().isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        customerMobile,
        siteAddress,
        siteAddressLine1,
        siteAddressLine2,
        siteCity,
        siteState,
        sitePostcode,
        linkToJobman,
        jobmanLeadId,
        // Extended fields
        siteAccess,
        parkingDetails,
        groundConditions,
        existingFence,
        specialRequirements,
        customFields,
        ...otherFields
      } = req.body;

      // TODO: Get actual user from auth middleware
      const createdById = req.user?.id || 'system';

      // If linking to existing Jobman lead, fetch data
      let jobmanLead = null;
      if (jobmanLeadId) {
        try {
          const response = await jobman.getLead(jobmanLeadId);
          jobmanLead = response.lead;
        } catch (e) {
          return res.status(400).json({ 
            error: 'Could not find Jobman lead',
            details: e.message 
          });
        }
      }

      // Create document
      const document = await prisma.liveDocument.create({
        data: {
          customerName: jobmanLead?.contact_name || customerName,
          customerEmail: jobmanLead?.contact_email || customerEmail,
          customerPhone: jobmanLead?.contact_phone || customerPhone,
          customerMobile: jobmanLead?.contact_mobile || customerMobile,
          siteAddress: jobmanLead?.site_address || siteAddress,
          siteAddressLine1: jobmanLead?.site_address_line1 || siteAddressLine1,
          siteAddressLine2: jobmanLead?.site_address_line2 || siteAddressLine2,
          siteCity: jobmanLead?.site_address_city || siteCity,
          siteState: jobmanLead?.site_address_region || siteState,
          sitePostcode: jobmanLead?.site_address_postal_code || sitePostcode,
          jobmanLeadId: jobmanLeadId || null,
          // Extended fields
          siteAccess,
          parkingDetails,
          groundConditions,
          existingFence,
          specialRequirements,
          customFields: customFields || {},
          ...otherFields,
          createdById
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // If requested, also create lead in Jobman
      if (linkToJobman && !jobmanLeadId) {
        try {
          const jobmanResponse = await jobman.createLead({
            contact_name: customerName,
            contact_email: customerEmail,
            contact_phone: customerPhone,
            contact_mobile: customerMobile,
            site_address_line1: siteAddressLine1,
            site_address_line2: siteAddressLine2,
            site_address_city: siteCity,
            site_address_region: siteState,
            site_address_postal_code: sitePostcode
            // Add more fields as needed
          });

          // Update document with Jobman link
          await prisma.liveDocument.update({
            where: { id: document.id },
            data: { jobmanLeadId: jobmanResponse.lead.id }
          });

          document.jobmanLeadId = jobmanResponse.lead.id;
        } catch (e) {
          console.error('Failed to create Jobman lead:', e);
          // Don't fail the whole request, just log it
        }
      }

      res.status(201).json({ document });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE DOCUMENT
// ============================================

router.put('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get existing document for change tracking
      const existing = await prisma.liveDocument.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // TODO: Get actual user from auth middleware
      const changedById = req.user?.id || 'system';

      // Track changes
      const changes = [];
      for (const [key, newValue] of Object.entries(updates)) {
        if (existing[key] !== newValue && key !== 'customFields') {
          changes.push({
            documentId: id,
            fieldName: key,
            oldValue: existing[key]?.toString() || null,
            newValue: newValue?.toString() || null,
            changedById
          });
        }
      }

      // Handle custom fields separately (merge, don't replace)
      if (updates.customFields) {
        updates.customFields = {
          ...(existing.customFields || {}),
          ...updates.customFields
        };
      }

      // Update document
      const document = await prisma.liveDocument.update({
        where: { id },
        data: updates,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Save changes to audit trail
      if (changes.length > 0) {
        await prisma.documentChange.createMany({
          data: changes
        });
      }

      res.json({ document, changesRecorded: changes.length });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE DOCUMENT STATUS
// ============================================

router.put('/:id/status',
  param('id').isUUID(),
  body('status').isIn(['LEAD', 'QUOTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const existing = await prisma.liveDocument.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // TODO: Get actual user from auth middleware
      const changedById = req.user?.id || 'system';

      // Update status
      const document = await prisma.liveDocument.update({
        where: { id },
        data: { status }
      });

      // Log the change
      await prisma.documentChange.create({
        data: {
          documentId: id,
          fieldName: 'status',
          oldValue: existing.status,
          newValue: status,
          changedById
        }
      });

      res.json({ document });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// LINK TO JOBMAN
// ============================================

router.post('/:id/link-jobman',
  param('id').isUUID(),
  body('type').isIn(['lead', 'quote', 'job']),
  body('jobmanId').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { type, jobmanId } = req.body;

      const document = await prisma.liveDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Verify the Jobman entity exists
      let jobmanEntity;
      try {
        if (type === 'lead') {
          jobmanEntity = await jobman.getLead(jobmanId);
        } else if (type === 'quote') {
          jobmanEntity = await jobman.getQuote(jobmanId);
        } else if (type === 'job') {
          jobmanEntity = await jobman.getJob(jobmanId);
        }
      } catch (e) {
        return res.status(400).json({ 
          error: `Jobman ${type} not found`,
          details: e.message 
        });
      }

      // Update the link
      const updateData = {};
      if (type === 'lead') updateData.jobmanLeadId = jobmanId;
      if (type === 'quote') updateData.jobmanQuoteId = jobmanId;
      if (type === 'job') updateData.jobmanJobId = jobmanId;

      const updated = await prisma.liveDocument.update({
        where: { id },
        data: updateData
      });

      res.json({ 
        document: updated,
        jobmanEntity 
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ADD CUSTOM FIELD
// ============================================

router.post('/:id/custom-field',
  param('id').isUUID(),
  body('fieldName').notEmpty().trim(),
  body('fieldValue').exists(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fieldName, fieldValue } = req.body;

      const document = await prisma.liveDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const customFields = document.customFields || {};
      customFields[fieldName] = fieldValue;

      const updated = await prisma.liveDocument.update({
        where: { id },
        data: { customFields }
      });

      res.json({ document: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// DELETE DOCUMENT
// ============================================

router.delete('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.liveDocument.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Document not found' });
      }
      next(error);
    }
  }
);

// ============================================
// GET DOCUMENT CHANGE HISTORY
// ============================================

router.get('/:id/history',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const changes = await prisma.documentChange.findMany({
        where: { documentId: id },
        orderBy: { changedAt: 'desc' },
        include: {
          changedBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      res.json({ changes });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
