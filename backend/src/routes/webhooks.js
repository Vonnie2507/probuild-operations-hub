/**
 * PROBUILD OPERATIONS HUB
 * Webhook Routes
 * 
 * Receives real-time updates from Jobman when:
 * - Contacts are created/updated
 * - Leads are created/updated/status changed
 * - Quotes are created/updated/status changed
 * - Jobs are created/updated/status changed
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { jobman } = require('../services/jobman');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// JOBMAN WEBHOOK RECEIVER
// ============================================

// Use raw body for signature verification
router.post('/jobman', 
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const signature = req.headers['x-signature'];
      const payload = req.body.toString();

      // Verify signature
      if (process.env.JOBMAN_WEBHOOK_SECRET) {
        const isValid = jobman.verifyWebhookSignature(payload, signature);
        if (!isValid) {
          console.warn('⚠️ Invalid webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const data = JSON.parse(payload);
      
      console.log(`📥 Webhook received: ${data.event} - ${data.entity} - ${data.id}`);

      // Log the webhook
      await prisma.jobmanSyncLog.create({
        data: {
          entityType: data.entity?.toLowerCase() || 'unknown',
          entityId: data.id,
          action: data.operation || data.event,
          direction: 'inbound',
          payload: data,
          status: 'success'
        }
      });

      // Process based on event type
      switch (data.event) {
        // ============================================
        // CONTACT EVENTS
        // ============================================
        case 'contact.created':
        case 'contact.updated':
          await handleContactEvent(data);
          break;

        // ============================================
        // LEAD EVENTS
        // ============================================
        case 'lead.created':
          await handleLeadCreated(data);
          break;
        case 'lead.updated':
          await handleLeadUpdated(data);
          break;
        case 'lead.status_changed':
          await handleLeadStatusChanged(data);
          break;

        // ============================================
        // QUOTE EVENTS
        // ============================================
        case 'quote.created':
          await handleQuoteCreated(data);
          break;
        case 'quote.updated':
          await handleQuoteUpdated(data);
          break;
        case 'quote.status_changed':
          await handleQuoteStatusChanged(data);
          break;

        // ============================================
        // JOB EVENTS
        // ============================================
        case 'job.created':
          await handleJobCreated(data);
          break;
        case 'job.updated':
          await handleJobUpdated(data);
          break;
        case 'job.status_changed':
          await handleJobStatusChanged(data);
          break;

        default:
          console.log(`Unhandled webhook event: ${data.event}`);
      }

      // Acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Log the error
      try {
        await prisma.jobmanSyncLog.create({
          data: {
            entityType: 'webhook',
            entityId: 'error',
            action: 'process',
            direction: 'inbound',
            status: 'failed',
            errorMessage: error.message
          }
        });
      } catch (e) {
        // Ignore logging errors
      }

      // Still return 200 to avoid retries
      res.status(200).json({ received: true, error: error.message });
    }
  }
);

// ============================================
// EVENT HANDLERS
// ============================================

async function handleContactEvent(data) {
  // Fetch full contact details from Jobman
  try {
    const contactResponse = await jobman.getContact(data.id);
    const contact = contactResponse.contact;

    // Update any Live Documents linked to this contact
    // (You might link documents to contacts in Jobman)
    console.log(`Contact updated: ${contact.name}`);
  } catch (e) {
    console.error('Error handling contact event:', e.message);
  }
}

async function handleLeadCreated(data) {
  try {
    const leadResponse = await jobman.getLead(data.id);
    const lead = leadResponse.lead;

    // Check if we already have a Live Document for this lead
    const existing = await prisma.liveDocument.findFirst({
      where: { jobmanLeadId: data.id }
    });

    if (!existing) {
      // Optionally auto-create a Live Document
      // For now, just log it
      console.log(`New Jobman lead: ${lead.name || lead.id}`);
    }
  } catch (e) {
    console.error('Error handling lead created:', e.message);
  }
}

async function handleLeadUpdated(data) {
  try {
    const leadResponse = await jobman.getLead(data.id);
    const lead = leadResponse.lead;

    // Find linked Live Document
    const document = await prisma.liveDocument.findFirst({
      where: { jobmanLeadId: data.id }
    });

    if (document) {
      // Update document with any changed data from Jobman
      await prisma.liveDocument.update({
        where: { id: document.id },
        data: {
          customerName: lead.contact_name || document.customerName,
          customerEmail: lead.contact_email || document.customerEmail,
          customerPhone: lead.contact_phone || document.customerPhone,
          siteAddress: lead.site_address || document.siteAddress
        }
      });
      console.log(`Updated Live Document from Jobman lead: ${document.id}`);
    }
  } catch (e) {
    console.error('Error handling lead updated:', e.message);
  }
}

async function handleLeadStatusChanged(data) {
  try {
    const leadResponse = await jobman.getLead(data.id);
    const lead = leadResponse.lead;

    // Find linked Live Document
    const document = await prisma.liveDocument.findFirst({
      where: { jobmanLeadId: data.id }
    });

    if (document) {
      // Map Jobman status to our status
      // This would need customization based on your Jobman statuses
      console.log(`Lead status changed: ${lead.lead_status_name}`);
    }
  } catch (e) {
    console.error('Error handling lead status change:', e.message);
  }
}

async function handleQuoteCreated(data) {
  try {
    const quoteResponse = await jobman.getQuote(data.id);
    const quote = quoteResponse.quote;

    // Find linked Live Document by lead
    const document = await prisma.liveDocument.findFirst({
      where: { jobmanLeadId: quote.lead_id }
    });

    if (document) {
      // Link the quote to our document
      await prisma.liveDocument.update({
        where: { id: document.id },
        data: {
          jobmanQuoteId: data.id,
          status: 'QUOTED'
        }
      });
      console.log(`Linked quote to Live Document: ${document.id}`);
    }
  } catch (e) {
    console.error('Error handling quote created:', e.message);
  }
}

async function handleQuoteUpdated(data) {
  try {
    // Fetch and sync quote data if needed
    console.log(`Quote updated: ${data.id}`);
  } catch (e) {
    console.error('Error handling quote updated:', e.message);
  }
}

async function handleQuoteStatusChanged(data) {
  try {
    const quoteResponse = await jobman.getQuote(data.id);
    const quote = quoteResponse.quote;

    // Find linked Live Document
    const document = await prisma.liveDocument.findFirst({
      where: { jobmanQuoteId: data.id }
    });

    if (document) {
      // Check if quote was accepted
      // This would need customization based on your "Accepted" status in Jobman
      const acceptedStatuses = ['accepted', 'approved', 'won'];
      if (acceptedStatuses.includes(quote.quote_status_name?.toLowerCase())) {
        await prisma.liveDocument.update({
          where: { id: document.id },
          data: { status: 'ACCEPTED' }
        });
        console.log(`Quote accepted - updated document status: ${document.id}`);
      }
    }
  } catch (e) {
    console.error('Error handling quote status change:', e.message);
  }
}

async function handleJobCreated(data) {
  try {
    const jobResponse = await jobman.getJob(data.id);
    const job = jobResponse.job;

    // Find linked Live Document by quote or lead
    let document = await prisma.liveDocument.findFirst({
      where: {
        OR: [
          { jobmanQuoteId: job.quote_id },
          { jobmanLeadId: job.lead_id }
        ]
      }
    });

    if (document) {
      // Link the job to our document
      await prisma.liveDocument.update({
        where: { id: document.id },
        data: {
          jobmanJobId: data.id,
          status: 'SCHEDULED'
        }
      });
      console.log(`Linked job to Live Document: ${document.id}`);
    }
  } catch (e) {
    console.error('Error handling job created:', e.message);
  }
}

async function handleJobUpdated(data) {
  try {
    // Fetch and sync job data if needed
    console.log(`Job updated: ${data.id}`);
  } catch (e) {
    console.error('Error handling job updated:', e.message);
  }
}

async function handleJobStatusChanged(data) {
  try {
    const jobResponse = await jobman.getJob(data.id);
    const job = jobResponse.job;

    // Find linked Live Document
    const document = await prisma.liveDocument.findFirst({
      where: { jobmanJobId: data.id }
    });

    if (document) {
      // Map Jobman job status to our status
      // This would need customization based on your Jobman statuses
      const statusName = job.job_status_name?.toLowerCase();
      
      let newStatus = document.status;
      if (statusName?.includes('progress') || statusName?.includes('active')) {
        newStatus = 'IN_PROGRESS';
      } else if (statusName?.includes('complete') || statusName?.includes('done')) {
        newStatus = 'COMPLETED';
      } else if (statusName?.includes('hold')) {
        newStatus = 'ON_HOLD';
      } else if (statusName?.includes('cancel')) {
        newStatus = 'CANCELLED';
      }

      if (newStatus !== document.status) {
        await prisma.liveDocument.update({
          where: { id: document.id },
          data: { status: newStatus }
        });
        console.log(`Job status changed - updated document: ${document.id} -> ${newStatus}`);
      }
    }
  } catch (e) {
    console.error('Error handling job status change:', e.message);
  }
}

module.exports = router;
