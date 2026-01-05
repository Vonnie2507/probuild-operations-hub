/**
 * PROBUILD OPERATIONS HUB
 * Jobman API Service
 * 
 * This service handles all communication with the Jobman API.
 * Documentation: https://api-docs.jobmanapp.com/
 * 
 * Rate Limits (Personal Access Token):
 * - 50 requests per minute
 * 
 * Base URL: https://api.jobmanapp.com/
 */

const BASE_URL = 'https://api.jobmanapp.com';

class JobmanAPI {
  constructor() {
    this.apiKey = process.env.JOBMAN_API_KEY;
    this.organisationId = process.env.JOBMAN_ORGANISATION_ID;
    this.webhookSecret = process.env.JOBMAN_WEBHOOK_SECRET;
    
    if (!this.apiKey) {
      console.warn('⚠️  JOBMAN_API_KEY not set - Jobman integration disabled');
    }
    if (!this.organisationId) {
      console.warn('⚠️  JOBMAN_ORGANISATION_ID not set - Jobman integration disabled');
    }
  }

  /**
   * Make authenticated request to Jobman API
   */
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Check rate limit headers
      const rateLimit = {
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset')
      };
      
      if (rateLimit.remaining && parseInt(rateLimit.remaining) < 10) {
        console.warn(`⚠️  Jobman API rate limit low: ${rateLimit.remaining} remaining`);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new JobmanAPIError(
          error.message || `Jobman API error: ${response.status}`,
          response.status,
          error
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof JobmanAPIError) throw error;
      throw new JobmanAPIError(`Network error: ${error.message}`, 0, error);
    }
  }

  /**
   * Organisation-scoped endpoint helper
   */
  orgEndpoint(path) {
    return `/api/v1/organisations/${this.organisationId}${path}`;
  }

  // ============================================
  // CONTACTS
  // ============================================

  /**
   * List all contacts
   * @param {Object} params - Query parameters (page, limit, search, filter, sort)
   */
  async listContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/contacts')}${query ? '?' + query : ''}`);
  }

  /**
   * Get a specific contact
   * @param {string} contactId - Contact UUID
   */
  async getContact(contactId) {
    return this.request(this.orgEndpoint(`/contacts/${contactId}`));
  }

  /**
   * Create a new contact
   * @param {Object} data - Contact data
   */
  async createContact(data) {
    return this.request(this.orgEndpoint('/contacts'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update a contact
   * @param {string} contactId - Contact UUID
   * @param {Object} data - Updated contact data
   */
  async updateContact(contactId, data) {
    return this.request(this.orgEndpoint(`/contacts/${contactId}`), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ============================================
  // LEADS
  // ============================================

  /**
   * List all leads
   * @param {Object} params - Query parameters
   */
  async listLeads(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/leads')}${query ? '?' + query : ''}`);
  }

  /**
   * Get a specific lead
   * @param {string} leadId - Lead UUID
   */
  async getLead(leadId) {
    return this.request(this.orgEndpoint(`/leads/${leadId}`));
  }

  /**
   * Create a new lead
   * @param {Object} data - Lead data
   * Required: contact_id, lead_type_id
   */
  async createLead(data) {
    return this.request(this.orgEndpoint('/leads'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update a lead
   * @param {string} leadId - Lead UUID
   * @param {Object} data - Updated lead data
   */
  async updateLead(leadId, data) {
    return this.request(this.orgEndpoint(`/leads/${leadId}`), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update lead status
   * @param {string} leadId - Lead UUID
   * @param {string} statusId - New status UUID
   */
  async updateLeadStatus(leadId, statusId) {
    return this.request(this.orgEndpoint(`/leads/${leadId}/status`), {
      method: 'PUT',
      body: JSON.stringify({ lead_status_id: statusId })
    });
  }

  /**
   * Create a quote from a lead
   * @param {string} leadId - Lead UUID
   */
  async createQuoteFromLead(leadId) {
    return this.request(this.orgEndpoint(`/leads/${leadId}/quotes`), {
      method: 'POST'
    });
  }

  /**
   * Create a job from a lead
   * @param {string} leadId - Lead UUID
   */
  async createJobFromLead(leadId) {
    return this.request(this.orgEndpoint(`/leads/${leadId}/jobs`), {
      method: 'POST'
    });
  }

  /**
   * Get lead files
   * @param {string} leadId - Lead UUID
   */
  async getLeadFiles(leadId) {
    return this.request(this.orgEndpoint(`/leads/${leadId}/files`));
  }

  /**
   * Upload file to lead
   * @param {string} leadId - Lead UUID
   * @param {Object} fileData - File upload data
   */
  async uploadLeadFile(leadId, fileData) {
    return this.request(this.orgEndpoint(`/leads/${leadId}/files`), {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  // ============================================
  // QUOTES
  // ============================================

  /**
   * List all quotes
   * @param {Object} params - Query parameters
   */
  async listQuotes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/quotes')}${query ? '?' + query : ''}`);
  }

  /**
   * Get a specific quote
   * @param {string} quoteId - Quote UUID
   */
  async getQuote(quoteId) {
    return this.request(this.orgEndpoint(`/quotes/${quoteId}`));
  }

  /**
   * Create a new quote
   * @param {Object} data - Quote data
   */
  async createQuote(data) {
    return this.request(this.orgEndpoint('/quotes'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update a quote
   * @param {string} quoteId - Quote UUID
   * @param {Object} data - Updated quote data
   */
  async updateQuote(quoteId, data) {
    return this.request(this.orgEndpoint(`/quotes/${quoteId}`), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update quote status
   * @param {string} quoteId - Quote UUID
   * @param {string} statusId - New status UUID
   */
  async updateQuoteStatus(quoteId, statusId) {
    return this.request(this.orgEndpoint(`/quotes/${quoteId}/status`), {
      method: 'PUT',
      body: JSON.stringify({ quote_status_id: statusId })
    });
  }

  /**
   * Create a job from a quote
   * @param {string} quoteId - Quote UUID
   */
  async createJobFromQuote(quoteId) {
    return this.request(this.orgEndpoint(`/quotes/${quoteId}/jobs`), {
      method: 'POST'
    });
  }

  /**
   * Generate quote PDF
   * @param {string} quoteId - Quote UUID
   */
  async generateQuotePDF(quoteId) {
    return this.request(this.orgEndpoint(`/quotes/${quoteId}/pdf`), {
      method: 'POST'
    });
  }

  /**
   * Send quote email
   * @param {string} quoteId - Quote UUID
   * @param {Object} emailData - Email data (to, subject, body, etc.)
   */
  async sendQuoteEmail(quoteId, emailData) {
    return this.request(this.orgEndpoint(`/quotes/${quoteId}/email`), {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
  }

  // ============================================
  // JOBS
  // ============================================

  /**
   * List all jobs
   * @param {Object} params - Query parameters
   */
  async listJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/jobs')}${query ? '?' + query : ''}`);
  }

  /**
   * Get a specific job
   * @param {string} jobId - Job UUID
   */
  async getJob(jobId) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}`));
  }

  /**
   * Create a new job
   * @param {Object} data - Job data
   */
  async createJob(data) {
    return this.request(this.orgEndpoint('/jobs'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update a job
   * @param {string} jobId - Job UUID
   * @param {Object} data - Updated job data
   */
  async updateJob(jobId, data) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}`), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update job status
   * @param {string} jobId - Job UUID
   * @param {string} statusId - New status UUID
   */
  async updateJobStatus(jobId, statusId) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}/status`), {
      method: 'PUT',
      body: JSON.stringify({ job_status_id: statusId })
    });
  }

  /**
   * Get job tasks
   * @param {string} jobId - Job UUID
   */
  async getJobTasks(jobId) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}/tasks`));
  }

  /**
   * Update job task progress
   * @param {string} jobId - Job UUID
   * @param {string} taskId - Task UUID
   * @param {number} progress - Progress percentage (0-100)
   */
  async updateJobTaskProgress(jobId, taskId, progress) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}/tasks/${taskId}/progress`), {
      method: 'PUT',
      body: JSON.stringify({ progress })
    });
  }

  /**
   * Get job files
   * @param {string} jobId - Job UUID
   */
  async getJobFiles(jobId) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}/files`));
  }

  /**
   * Upload file to job
   * @param {string} jobId - Job UUID
   * @param {Object} fileData - File upload data
   */
  async uploadJobFile(jobId, fileData) {
    return this.request(this.orgEndpoint(`/jobs/${jobId}/files`), {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  // ============================================
  // STAFF & TIMESHEETS
  // ============================================

  /**
   * List all staff members
   * @param {Object} params - Query parameters
   */
  async listStaff(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/staff')}${query ? '?' + query : ''}`);
  }

  /**
   * Get a staff member
   * @param {string} staffId - Staff UUID
   */
  async getStaff(staffId) {
    return this.request(this.orgEndpoint(`/staff/${staffId}`));
  }

  /**
   * Get staff timesheet entries
   * @param {string} staffId - Staff UUID
   * @param {Object} params - Query parameters (date range, etc.)
   */
  async getStaffTimesheet(staffId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint(`/staff/${staffId}/timesheet`)}${query ? '?' + query : ''}`);
  }

  // ============================================
  // SETTINGS & LOOKUPS
  // ============================================

  /**
   * Get lead statuses
   */
  async getLeadStatuses() {
    return this.request(this.orgEndpoint('/settings/lead-statuses'));
  }

  /**
   * Get lead types
   */
  async getLeadTypes() {
    return this.request(this.orgEndpoint('/settings/lead-types'));
  }

  /**
   * Get quote statuses
   */
  async getQuoteStatuses() {
    return this.request(this.orgEndpoint('/settings/quote-statuses'));
  }

  /**
   * Get job statuses
   */
  async getJobStatuses() {
    return this.request(this.orgEndpoint('/settings/job-statuses'));
  }

  /**
   * Get job types
   */
  async getJobTypes() {
    return this.request(this.orgEndpoint('/settings/job-types'));
  }

  /**
   * Get contact types
   */
  async getContactTypes() {
    return this.request(this.orgEndpoint('/settings/contact-types'));
  }

  /**
   * Get contact sources
   */
  async getContactSources() {
    return this.request(this.orgEndpoint('/settings/contact-sources'));
  }

  /**
   * Get workflows
   */
  async getWorkflows() {
    return this.request(this.orgEndpoint('/settings/workflows'));
  }

  // ============================================
  // CATALOGUE & INVENTORY
  // ============================================

  /**
   * List catalogue materials
   * @param {Object} params - Query parameters
   */
  async listCatalogueMaterials(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/catalogue/materials')}${query ? '?' + query : ''}`);
  }

  /**
   * List catalogue products
   * @param {Object} params - Query parameters
   */
  async listCatalogueProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/catalogue/products')}${query ? '?' + query : ''}`);
  }

  /**
   * List inventory materials
   * @param {Object} params - Query parameters
   */
  async listInventoryMaterials(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${this.orgEndpoint('/inventory/materials')}${query ? '?' + query : ''}`);
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - X-Signature header value
   * @returns {boolean} - Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('base64');
    
    return signature === expectedSignature;
  }

  /**
   * List webhook endpoints
   */
  async listWebhooks() {
    return this.request(this.orgEndpoint('/settings/webhooks'));
  }

  /**
   * Create webhook endpoint
   * @param {Object} data - Webhook data (url, events, etc.)
   */
  async createWebhook(data) {
    return this.request(this.orgEndpoint('/settings/webhooks'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ============================================
  // FILE UPLOADS
  // ============================================

  /**
   * Upload a file to Jobman
   * Note: This is a two-step process:
   * 1. Upload to Jobman's upload endpoint
   * 2. Attach to lead/job/contact
   * 
   * @param {Buffer} fileBuffer - File content
   * @param {string} filename - Original filename
   * @param {string} mimeType - File MIME type
   */
  async uploadFile(fileBuffer, filename, mimeType) {
    // Jobman uses multipart form data for uploads
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename,
      contentType: mimeType
    });

    const response = await fetch(`${BASE_URL}${this.orgEndpoint('/uploads')}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new JobmanAPIError(
        error.message || `Upload failed: ${response.status}`,
        response.status,
        error
      );
    }

    return response.json();
  }
}

/**
 * Custom error class for Jobman API errors
 */
class JobmanAPIError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'JobmanAPIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Export singleton instance
const jobman = new JobmanAPI();

module.exports = {
  jobman,
  JobmanAPI,
  JobmanAPIError
};
