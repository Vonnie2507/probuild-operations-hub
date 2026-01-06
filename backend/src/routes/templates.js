/**
 * PROBUILD OPERATIONS HUB
 * Form Templates API Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Available template variables (like Jobman)
const TEMPLATE_VARIABLES = {
  organisation: [
    { id: 'organisation.name', name: 'Organisation Name', example: 'Probuild PVC' },
    { id: 'organisation.email', name: 'Organisation Email', example: 'info@probuildpvc.com.au' },
    { id: 'organisation.phone', name: 'Organisation Phone', example: '08 1234 5678' },
    { id: 'organisation.address', name: 'Organisation Address', example: '123 Industrial Way, Perth WA 6000' },
    { id: 'organisation.logo', name: 'Organisation Logo URL', example: '/logo.png' },
    { id: 'organisation.abn', name: 'ABN', example: '12 345 678 901' },
  ],
  job: [
    { id: 'job.id', name: 'Job ID', example: 'abc-123' },
    { id: 'job.number', name: 'Job Number', example: '0093' },
    { id: 'job.description', name: 'Job Description', example: 'PVC Fencing Installation' },
    { id: 'job.site_address', name: 'Site Address (Full)', example: '10 Example Street, Smithville VIC 3000' },
    { id: 'job.site_address_line1', name: 'Site Address Line 1', example: '10 Example Street' },
    { id: 'job.site_address_line2', name: 'Site Address Line 2', example: '' },
    { id: 'job.site_address_city', name: 'Site City', example: 'Smithville' },
    { id: 'job.site_address_region', name: 'Site State/Region', example: 'VIC' },
    { id: 'job.site_address_postal_code', name: 'Site Postcode', example: '3000' },
    { id: 'job.status', name: 'Job Status', example: 'In Progress' },
    { id: 'job.value', name: 'Job Value', example: '$5,450.00' },
  ],
  contact: [
    { id: 'job.contact.id', name: 'Contact ID', example: 'xyz-456' },
    { id: 'job.contact.name', name: 'Contact Name', example: 'John Smith' },
    { id: 'job.contact.email', name: 'Contact Email', example: 'john@example.com' },
    { id: 'job.contact.phone', name: 'Contact Phone', example: '0412 345 678' },
    { id: 'job.contact.mobile', name: 'Contact Mobile', example: '0412 345 678' },
  ],
  document: [
    { id: 'document.id', name: 'Document ID', example: 'doc-789' },
    { id: 'document.customer_name', name: 'Customer Name', example: 'John Smith' },
    { id: 'document.site_address', name: 'Site Address', example: '10 Example Street, Smithville VIC 3000' },
    { id: 'document.site_access', name: 'Site Access Notes', example: 'Gate code: 1234' },
    { id: 'document.ground_conditions', name: 'Ground Conditions', example: 'Sandy soil, slight slope' },
    { id: 'document.install_notes', name: 'Installation Notes', example: 'Customer prefers white posts' },
  ],
  form: [
    { id: 'form.id', name: 'Form ID', example: 'form-001' },
    { id: 'form.name', name: 'Form Name', example: 'Site Assessment' },
    { id: 'form.type', name: 'Form Type', example: 'SITE_ASSESSMENT' },
    { id: 'form.submitted_by', name: 'Submitted By', example: 'Wayne Salisbury' },
    { id: 'form.submitted_at', name: 'Submitted Date', example: '06/01/2026' },
  ],
  date: [
    { id: 'date.today', name: 'Today\'s Date', example: '06/01/2026' },
    { id: 'date.time', name: 'Current Time', example: '09:30 AM' },
    { id: 'date.year', name: 'Year', example: '2026' },
  ],
  staff: [
    { id: 'staff.name', name: 'Current Staff Name', example: 'Jake Fernie' },
    { id: 'staff.email', name: 'Current Staff Email', example: 'jake@probuildpvc.com.au' },
  ],
};

// Get all template variables
router.get('/variables', (req, res) => {
  res.json(TEMPLATE_VARIABLES);
});

// Get all form templates
router.get('/', async (req, res, next) => {
  try {
    const { type, active } = req.query;

    const where = {};
    if (type) where.type = type;
    if (active !== undefined) where.isActive = active === 'true';

    const templates = await prisma.formTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } }
      }
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get single template
router.get('/:id', async (req, res, next) => {
  try {
    const template = await prisma.formTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { submissions: true } }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Create new template
router.post('/', async (req, res, next) => {
  try {
    const { name, description, type, htmlTemplate, cssStyles } = req.body;

    if (!name || !htmlTemplate) {
      return res.status(400).json({ error: 'Name and HTML template are required' });
    }

    const template = await prisma.formTemplate.create({
      data: {
        name,
        description,
        type: type || 'CUSTOM',
        htmlTemplate,
        cssStyles,
      }
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, type, htmlTemplate, cssStyles, isActive } = req.body;

    const template = await prisma.formTemplate.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        type,
        htmlTemplate,
        cssStyles,
        isActive,
      }
    });

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Delete template
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.formTemplate.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Preview template with sample data
router.post('/:id/preview', async (req, res, next) => {
  try {
    const template = await prisma.formTemplate.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Sample data for preview
    const sampleData = {
      organisation: {
        name: 'Probuild PVC',
        email: 'info@probuildpvc.com.au',
        phone: '08 9302 2277',
        address: '2/10 Energy Street, Malaga WA 6090',
        logo: 'https://probuild-operations-hub-production.up.railway.app/logo.png',
        abn: '12 345 678 901',
      },
      job: {
        id: 'sample-job-123',
        number: '0093',
        description: 'PVC Fencing Installation',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_address_line1: '10 Example Street',
        site_address_line2: '',
        site_address_city: 'Smithville',
        site_address_region: 'VIC',
        site_address_postal_code: '3000',
        status: 'In Progress',
        value: '$5,450.00',
        contact: {
          id: 'contact-456',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '03 1234 5678',
          mobile: '0412 345 678',
        }
      },
      document: {
        id: 'doc-789',
        customer_name: 'John Smith',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_access: 'Gate code: 1234, park in driveway',
        ground_conditions: 'Sandy soil, slight slope to rear',
        install_notes: 'Customer prefers white posts, dog on property',
      },
      form: {
        id: template.id,
        name: template.name,
        type: template.type,
        submitted_by: 'Wayne Salisbury',
        submitted_at: new Date().toLocaleDateString('en-AU'),
      },
      date: {
        today: new Date().toLocaleDateString('en-AU'),
        time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        year: new Date().getFullYear().toString(),
      },
      staff: {
        name: 'Jake Fernie',
        email: 'jake@probuildpvc.com.au',
      },
      // Allow custom data from request body
      ...req.body.data
    };

    // Render template with data
    const renderedHtml = renderTemplate(template.htmlTemplate, sampleData);
    const fullHtml = wrapWithStyles(renderedHtml, template.cssStyles);

    res.json({
      template,
      renderedHtml: fullHtml,
      sampleData,
    });
  } catch (error) {
    next(error);
  }
});

// Preview raw HTML (without saving)
router.post('/preview-raw', (req, res, next) => {
  try {
    const { htmlTemplate, cssStyles, data } = req.body;

    if (!htmlTemplate) {
      return res.status(400).json({ error: 'HTML template is required' });
    }

    // Sample data
    const sampleData = {
      organisation: {
        name: 'Probuild PVC',
        email: 'info@probuildpvc.com.au',
        phone: '08 9302 2277',
        address: '2/10 Energy Street, Malaga WA 6090',
        logo: 'https://probuild-operations-hub-production.up.railway.app/logo.png',
        abn: '12 345 678 901',
      },
      job: {
        id: 'sample-job-123',
        number: '0093',
        description: 'PVC Fencing Installation',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_address_line1: '10 Example Street',
        site_address_line2: '',
        site_address_city: 'Smithville',
        site_address_region: 'VIC',
        site_address_postal_code: '3000',
        status: 'In Progress',
        value: '$5,450.00',
        contact: {
          id: 'contact-456',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '03 1234 5678',
          mobile: '0412 345 678',
        }
      },
      document: {
        id: 'doc-789',
        customer_name: 'John Smith',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_access: 'Gate code: 1234, park in driveway',
        ground_conditions: 'Sandy soil, slight slope to rear',
        install_notes: 'Customer prefers white posts, dog on property',
      },
      form: {
        id: 'preview',
        name: 'Preview Form',
        type: 'CUSTOM',
        submitted_by: 'Wayne Salisbury',
        submitted_at: new Date().toLocaleDateString('en-AU'),
      },
      date: {
        today: new Date().toLocaleDateString('en-AU'),
        time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        year: new Date().getFullYear().toString(),
      },
      staff: {
        name: 'Jake Fernie',
        email: 'jake@probuildpvc.com.au',
      },
      ...data
    };

    const renderedHtml = renderTemplate(htmlTemplate, sampleData);
    const fullHtml = wrapWithStyles(renderedHtml, cssStyles);

    res.json({ renderedHtml: fullHtml });
  } catch (error) {
    next(error);
  }
});

// Helper: Render template by replacing {{ variable }} placeholders
function renderTemplate(template, data) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? value : match;
  });
}

// Helper: Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Helper: Wrap rendered HTML with styles
function wrapWithStyles(html, css) {
  if (!css) return html;
  return `<style>${css}</style>\n${html}`;
}

module.exports = router;
