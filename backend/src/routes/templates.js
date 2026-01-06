/**
 * PROBUILD OPERATIONS HUB
 * Form Templates API Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Available template variables (matching Jobman's format)
const TEMPLATE_VARIABLES = {
  date: [
    { id: 'year', name: 'Year', example: '2026' },
  ],
  organisation: [
    { id: 'organisation.id', name: 'Organisation ID', example: 'org-123' },
    { id: 'organisation.name', name: 'Organisation Name', example: 'Probuild PVC' },
    { id: 'organisation.email', name: 'Organisation Email', example: 'info@probuildpvc.com.au' },
    { id: 'organisation.currency', name: 'Currency', example: 'AUD' },
    { id: 'organisation.language', name: 'Language', example: 'en' },
    { id: 'organisation.timezone', name: 'Timezone', example: 'Australia/Perth' },
    { id: 'organisation.website', name: 'Website', example: 'https://probuildpvc.com.au' },
    { id: 'organisation.tax_number', name: 'Tax Number (ABN)', example: '12 345 678 901' },
    { id: 'organisation.logo', name: 'Logo URL', example: '/logo.png' },
  ],
  form: [
    { id: 'introduction', name: 'Introduction', example: 'Site assessment form' },
    { id: 'form.id', name: 'Form ID', example: 'form-001' },
    { id: 'form.name', name: 'Form Name', example: 'Site Assessment' },
    { id: 'form.type.id', name: 'Form Type ID', example: 'SITE_ASSESSMENT' },
    { id: 'form.type.name', name: 'Form Type Name', example: 'Site Assessment' },
    { id: 'form.completed_at', name: 'Completed At', example: '06/01/2026 09:30' },
    { id: 'form.completed_by', name: 'Completed By', example: 'Wayne Salisbury' },
    { id: 'form.responses', name: 'Form Responses', example: '{}' },
    { id: 'form.responses.*.name', name: 'Response Section Name', example: 'Section 1' },
    { id: 'form.responses.*.questions.*.name', name: 'Question Name', example: 'Ground conditions' },
    { id: 'form.responses.*.questions.*.options', name: 'Question Options', example: '[]' },
    { id: 'form.responses.*.questions.*.is_required', name: 'Is Required', example: 'true' },
    { id: 'form.responses.*.questions.*.value', name: 'Question Value', example: 'Sandy soil' },
    { id: 'form.responses.*.questions.*.value_label', name: 'Value Label', example: 'Sandy soil' },
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
    { id: 'job.site_address_country_name', name: 'Site Country', example: 'Australia' },
    { id: 'job.site_address_postal_code', name: 'Site Postcode', example: '3000' },
  ],
  job_contact: [
    { id: 'job.contact.id', name: 'Contact ID', example: 'xyz-456' },
    { id: 'job.contact.name', name: 'Contact Name', example: 'John Smith' },
    { id: 'job.contact.email', name: 'Contact Email', example: 'john@example.com' },
    { id: 'job.contact.street_address', name: 'Street Address (Full)', example: '10 Example Street, Smithville VIC 3000' },
    { id: 'job.contact.street_address_line1', name: 'Street Address Line 1', example: '10 Example Street' },
    { id: 'job.contact.street_address_line2', name: 'Street Address Line 2', example: '' },
    { id: 'job.contact.street_address_city', name: 'Street Address City', example: 'Smithville' },
    { id: 'job.contact.street_address_region', name: 'Street Address Region', example: 'VIC' },
    { id: 'job.contact.street_address_country_name', name: 'Street Address Country', example: 'Australia' },
    { id: 'job.contact.street_address_postal_code', name: 'Street Address Postcode', example: '3000' },
    { id: 'job.contact.postal_address', name: 'Postal Address (Full)', example: 'PO Box 123, Smithville VIC 3000' },
    { id: 'job.contact.postal_address_line1', name: 'Postal Address Line 1', example: 'PO Box 123' },
    { id: 'job.contact.postal_address_line2', name: 'Postal Address Line 2', example: '' },
    { id: 'job.contact.postal_address_city', name: 'Postal Address City', example: 'Smithville' },
    { id: 'job.contact.postal_address_region', name: 'Postal Address Region', example: 'VIC' },
    { id: 'job.contact.postal_address_country_name', name: 'Postal Address Country', example: 'Australia' },
    { id: 'job.contact.postal_address_postal_code', name: 'Postal Address Postcode', example: '3000' },
  ],
  lead: [
    { id: 'lead.id', name: 'Lead ID', example: 'lead-123' },
    { id: 'lead.number', name: 'Lead Number', example: '0045' },
    { id: 'lead.description', name: 'Lead Description', example: 'New fence enquiry' },
    { id: 'lead.site_address', name: 'Site Address (Full)', example: '10 Example Street, Smithville VIC 3000' },
    { id: 'lead.site_address_line1', name: 'Site Address Line 1', example: '10 Example Street' },
    { id: 'lead.site_address_line2', name: 'Site Address Line 2', example: '' },
    { id: 'lead.site_address_city', name: 'Site City', example: 'Smithville' },
    { id: 'lead.site_address_region', name: 'Site State/Region', example: 'VIC' },
    { id: 'lead.site_address_country_name', name: 'Site Country', example: 'Australia' },
    { id: 'lead.site_address_postal_code', name: 'Site Postcode', example: '3000' },
  ],
  lead_contact: [
    { id: 'lead.contact.id', name: 'Contact ID', example: 'xyz-456' },
    { id: 'lead.contact.name', name: 'Contact Name', example: 'John Smith' },
    { id: 'lead.contact.email', name: 'Contact Email', example: 'john@example.com' },
    { id: 'lead.contact.street_address', name: 'Street Address (Full)', example: '10 Example Street, Smithville VIC 3000' },
    { id: 'lead.contact.street_address_line1', name: 'Street Address Line 1', example: '10 Example Street' },
    { id: 'lead.contact.street_address_line2', name: 'Street Address Line 2', example: '' },
    { id: 'lead.contact.street_address_city', name: 'Street Address City', example: 'Smithville' },
    { id: 'lead.contact.street_address_region', name: 'Street Address Region', example: 'VIC' },
    { id: 'lead.contact.street_address_country_name', name: 'Street Address Country', example: 'Australia' },
    { id: 'lead.contact.street_address_postal_code', name: 'Street Address Postcode', example: '3000' },
    { id: 'lead.contact.postal_address', name: 'Postal Address (Full)', example: 'PO Box 123, Smithville VIC 3000' },
    { id: 'lead.contact.postal_address_line1', name: 'Postal Address Line 1', example: 'PO Box 123' },
    { id: 'lead.contact.postal_address_line2', name: 'Postal Address Line 2', example: '' },
    { id: 'lead.contact.postal_address_city', name: 'Postal Address City', example: 'Smithville' },
    { id: 'lead.contact.postal_address_region', name: 'Postal Address Region', example: 'VIC' },
    { id: 'lead.contact.postal_address_country_name', name: 'Postal Address Country', example: 'Australia' },
    { id: 'lead.contact.postal_address_postal_code', name: 'Postal Address Postcode', example: '3000' },
  ],
  project: [
    { id: 'project.id', name: 'Project ID', example: 'proj-123' },
    { id: 'project.number', name: 'Project Number', example: 'P001' },
    { id: 'project.description', name: 'Project Description', example: 'Residential Development' },
  ],
  document: [
    { id: 'document.id', name: 'Document ID', example: 'doc-789' },
    { id: 'document.customer_name', name: 'Customer Name', example: 'John Smith' },
    { id: 'document.site_address', name: 'Site Address', example: '10 Example Street, Smithville VIC 3000' },
    { id: 'document.site_access', name: 'Site Access Notes', example: 'Gate code: 1234' },
    { id: 'document.ground_conditions', name: 'Ground Conditions', example: 'Sandy soil, slight slope' },
    { id: 'document.install_notes', name: 'Installation Notes', example: 'Customer prefers white posts' },
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

    // Sample data for preview (matching Jobman's format)
    const sampleData = {
      year: new Date().getFullYear().toString(),
      introduction: template.description || 'Form template',
      organisation: {
        id: 'org-123',
        name: 'Probuild PVC',
        email: 'info@probuildpvc.com.au',
        currency: 'AUD',
        language: 'en',
        timezone: 'Australia/Perth',
        website: 'https://probuildpvc.com.au',
        tax_number: '12 345 678 901',
        logo: 'https://probuild-operations-hub-production.up.railway.app/logo.png',
      },
      form: {
        id: template.id,
        name: template.name,
        type: { id: template.type, name: template.type.replace(/_/g, ' ') },
        completed_at: new Date().toLocaleString('en-AU'),
        completed_by: 'Wayne Salisbury',
        responses: {},
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
        site_address_country_name: 'Australia',
        site_address_postal_code: '3000',
        contact: {
          id: 'contact-456',
          name: 'John Smith',
          email: 'john@example.com',
          street_address: '10 Example Street, Smithville VIC 3000',
          street_address_line1: '10 Example Street',
          street_address_line2: '',
          street_address_city: 'Smithville',
          street_address_region: 'VIC',
          street_address_country_name: 'Australia',
          street_address_postal_code: '3000',
          postal_address: 'PO Box 123, Smithville VIC 3000',
          postal_address_line1: 'PO Box 123',
          postal_address_line2: '',
          postal_address_city: 'Smithville',
          postal_address_region: 'VIC',
          postal_address_country_name: 'Australia',
          postal_address_postal_code: '3000',
        }
      },
      lead: {
        id: 'lead-123',
        number: '0045',
        description: 'New fence enquiry',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_address_line1: '10 Example Street',
        site_address_line2: '',
        site_address_city: 'Smithville',
        site_address_region: 'VIC',
        site_address_country_name: 'Australia',
        site_address_postal_code: '3000',
        contact: {
          id: 'contact-456',
          name: 'John Smith',
          email: 'john@example.com',
          street_address: '10 Example Street, Smithville VIC 3000',
          street_address_line1: '10 Example Street',
          street_address_line2: '',
          street_address_city: 'Smithville',
          street_address_region: 'VIC',
          street_address_country_name: 'Australia',
          street_address_postal_code: '3000',
          postal_address: 'PO Box 123, Smithville VIC 3000',
          postal_address_line1: 'PO Box 123',
          postal_address_line2: '',
          postal_address_city: 'Smithville',
          postal_address_region: 'VIC',
          postal_address_country_name: 'Australia',
          postal_address_postal_code: '3000',
        }
      },
      project: {
        id: 'proj-123',
        number: 'P001',
        description: 'Residential Development',
      },
      document: {
        id: 'doc-789',
        customer_name: 'John Smith',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_access: 'Gate code: 1234, park in driveway',
        ground_conditions: 'Sandy soil, slight slope to rear',
        install_notes: 'Customer prefers white posts, dog on property',
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

    // Sample data (matching Jobman's format)
    const sampleData = {
      year: new Date().getFullYear().toString(),
      introduction: 'Preview form template',
      organisation: {
        id: 'org-123',
        name: 'Probuild PVC',
        email: 'info@probuildpvc.com.au',
        currency: 'AUD',
        language: 'en',
        timezone: 'Australia/Perth',
        website: 'https://probuildpvc.com.au',
        tax_number: '12 345 678 901',
        logo: 'https://probuild-operations-hub-production.up.railway.app/logo.png',
      },
      form: {
        id: 'preview',
        name: 'Preview Form',
        type: { id: 'CUSTOM', name: 'Custom' },
        completed_at: new Date().toLocaleString('en-AU'),
        completed_by: 'Wayne Salisbury',
        responses: {},
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
        site_address_country_name: 'Australia',
        site_address_postal_code: '3000',
        contact: {
          id: 'contact-456',
          name: 'John Smith',
          email: 'john@example.com',
          street_address: '10 Example Street, Smithville VIC 3000',
          street_address_line1: '10 Example Street',
          street_address_line2: '',
          street_address_city: 'Smithville',
          street_address_region: 'VIC',
          street_address_country_name: 'Australia',
          street_address_postal_code: '3000',
          postal_address: 'PO Box 123, Smithville VIC 3000',
          postal_address_line1: 'PO Box 123',
          postal_address_line2: '',
          postal_address_city: 'Smithville',
          postal_address_region: 'VIC',
          postal_address_country_name: 'Australia',
          postal_address_postal_code: '3000',
        }
      },
      lead: {
        id: 'lead-123',
        number: '0045',
        description: 'New fence enquiry',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_address_line1: '10 Example Street',
        site_address_line2: '',
        site_address_city: 'Smithville',
        site_address_region: 'VIC',
        site_address_country_name: 'Australia',
        site_address_postal_code: '3000',
        contact: {
          id: 'contact-456',
          name: 'John Smith',
          email: 'john@example.com',
          street_address: '10 Example Street, Smithville VIC 3000',
          street_address_line1: '10 Example Street',
          street_address_line2: '',
          street_address_city: 'Smithville',
          street_address_region: 'VIC',
          street_address_country_name: 'Australia',
          street_address_postal_code: '3000',
          postal_address: 'PO Box 123, Smithville VIC 3000',
          postal_address_line1: 'PO Box 123',
          postal_address_line2: '',
          postal_address_city: 'Smithville',
          postal_address_region: 'VIC',
          postal_address_country_name: 'Australia',
          postal_address_postal_code: '3000',
        }
      },
      project: {
        id: 'proj-123',
        number: 'P001',
        description: 'Residential Development',
      },
      document: {
        id: 'doc-789',
        customer_name: 'John Smith',
        site_address: '10 Example Street, Smithville VIC 3000',
        site_access: 'Gate code: 1234, park in driveway',
        ground_conditions: 'Sandy soil, slight slope to rear',
        install_notes: 'Customer prefers white posts, dog on property',
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
