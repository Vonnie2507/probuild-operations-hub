/**
 * PROBUILD OPERATIONS HUB
 * Jobman API Proxy Routes
 * 
 * These routes allow the frontend to interact with Jobman
 * through our backend, keeping the API key secure.
 */

const express = require('express');
const { jobman } = require('../services/jobman');

const router = express.Router();

// ============================================
// CONTACTS
// ============================================

router.get('/contacts', async (req, res, next) => {
  try {
    const result = await jobman.listContacts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/contacts/:id', async (req, res, next) => {
  try {
    const result = await jobman.getContact(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/contacts', async (req, res, next) => {
  try {
    const result = await jobman.createContact(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// LEADS
// ============================================

router.get('/leads', async (req, res, next) => {
  try {
    const result = await jobman.listLeads(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/leads/:id', async (req, res, next) => {
  try {
    const result = await jobman.getLead(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/leads', async (req, res, next) => {
  try {
    const result = await jobman.createLead(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/leads/:id', async (req, res, next) => {
  try {
    const result = await jobman.updateLead(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/leads/:id/status', async (req, res, next) => {
  try {
    const result = await jobman.updateLeadStatus(req.params.id, req.body.status_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/leads/:id/quotes', async (req, res, next) => {
  try {
    const result = await jobman.createQuoteFromLead(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/leads/:id/jobs', async (req, res, next) => {
  try {
    const result = await jobman.createJobFromLead(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// QUOTES
// ============================================

router.get('/quotes', async (req, res, next) => {
  try {
    const result = await jobman.listQuotes(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/quotes/:id', async (req, res, next) => {
  try {
    const result = await jobman.getQuote(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/quotes', async (req, res, next) => {
  try {
    const result = await jobman.createQuote(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/quotes/:id', async (req, res, next) => {
  try {
    const result = await jobman.updateQuote(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/quotes/:id/status', async (req, res, next) => {
  try {
    const result = await jobman.updateQuoteStatus(req.params.id, req.body.status_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/quotes/:id/jobs', async (req, res, next) => {
  try {
    const result = await jobman.createJobFromQuote(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/quotes/:id/pdf', async (req, res, next) => {
  try {
    const result = await jobman.generateQuotePDF(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// JOBS
// ============================================

router.get('/jobs', async (req, res, next) => {
  try {
    const result = await jobman.listJobs(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:id', async (req, res, next) => {
  try {
    const result = await jobman.getJob(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/jobs', async (req, res, next) => {
  try {
    const result = await jobman.createJob(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/jobs/:id', async (req, res, next) => {
  try {
    const result = await jobman.updateJob(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/jobs/:id/status', async (req, res, next) => {
  try {
    const result = await jobman.updateJobStatus(req.params.id, req.body.status_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:id/tasks', async (req, res, next) => {
  try {
    const result = await jobman.getJobTasks(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:id/files', async (req, res, next) => {
  try {
    const result = await jobman.getJobFiles(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// STAFF
// ============================================

router.get('/staff', async (req, res, next) => {
  try {
    const result = await jobman.listStaff(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/staff/:id', async (req, res, next) => {
  try {
    const result = await jobman.getStaff(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/staff/:id/timesheet', async (req, res, next) => {
  try {
    const result = await jobman.getStaffTimesheet(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// SETTINGS / LOOKUPS
// ============================================

router.get('/settings/lead-statuses', async (req, res, next) => {
  try {
    const result = await jobman.getLeadStatuses();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/lead-types', async (req, res, next) => {
  try {
    const result = await jobman.getLeadTypes();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/quote-statuses', async (req, res, next) => {
  try {
    const result = await jobman.getQuoteStatuses();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/job-statuses', async (req, res, next) => {
  try {
    const result = await jobman.getJobStatuses();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/job-types', async (req, res, next) => {
  try {
    const result = await jobman.getJobTypes();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/contact-types', async (req, res, next) => {
  try {
    const result = await jobman.getContactTypes();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/contact-sources', async (req, res, next) => {
  try {
    const result = await jobman.getContactSources();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/settings/workflows', async (req, res, next) => {
  try {
    const result = await jobman.getWorkflows();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// CATALOGUE
// ============================================

router.get('/catalogue/materials', async (req, res, next) => {
  try {
    const result = await jobman.listCatalogueMaterials(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/catalogue/products', async (req, res, next) => {
  try {
    const result = await jobman.listCatalogueProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/inventory/materials', async (req, res, next) => {
  try {
    const result = await jobman.listInventoryMaterials(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
