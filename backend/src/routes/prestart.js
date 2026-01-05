/**
 * PROBUILD OPERATIONS HUB
 * Pre-Start Meeting Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, query, validationResult } = require('express-validator');
const { jobman } = require('../services/jobman');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// GET TODAY'S PRE-START (or create if doesn't exist)
// ============================================

router.get('/today', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find or create today's meeting
    let meeting = await prisma.prestartMeeting.findFirst({
      where: {
        meetingDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        runBy: {
          select: { id: true, name: true }
        },
        jobs: {
          include: {
            document: {
              select: {
                id: true,
                customerName: true,
                siteAddress: true,
                status: true,
                jobmanJobId: true
              }
            }
          }
        }
      }
    });

    // If no meeting exists, fetch scheduled jobs from Jobman and create one
    if (!meeting) {
      // Get today's and yesterday's jobs from Jobman
      let todaysJobs = [];
      let yesterdaysJobs = [];
      
      try {
        // This would need to filter by scheduled date in Jobman
        const jobsResponse = await jobman.listJobs({ 
          // Jobman filtering syntax
        });
        // Parse and filter jobs by date
        // This is simplified - you'd need actual date filtering
      } catch (e) {
        console.warn('Could not fetch Jobman jobs:', e.message);
      }

      // For now, just create an empty meeting
      // In production, you'd populate jobs from Jobman
      meeting = {
        id: null,
        meetingDate: today,
        staffPresent: [],
        jobs: [],
        _needsCreation: true
      };
    }

    res.json({ meeting });
  } catch (error) {
    next(error);
  }
});

// ============================================
// LIST ALL MEETINGS
// ============================================

router.get('/',
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const { from, to, limit = 30 } = req.query;

      const where = {};
      if (from || to) {
        where.meetingDate = {};
        if (from) where.meetingDate.gte = new Date(from);
        if (to) where.meetingDate.lte = new Date(to);
      }

      const meetings = await prisma.prestartMeeting.findMany({
        where,
        orderBy: { meetingDate: 'desc' },
        take: parseInt(limit),
        include: {
          runBy: {
            select: { id: true, name: true }
          },
          _count: {
            select: { jobs: true }
          }
        }
      });

      res.json({ meetings });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET SINGLE MEETING
// ============================================

router.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const meeting = await prisma.prestartMeeting.findUnique({
        where: { id },
        include: {
          runBy: {
            select: { id: true, name: true }
          },
          jobs: {
            include: {
              document: true
            }
          }
        }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      res.json({ meeting });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// CREATE MEETING
// ============================================

router.post('/',
  body('meetingDate').isISO8601(),
  body('staffPresent').isArray(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { meetingDate, staffPresent } = req.body;

      // TODO: Get actual user from auth middleware
      const runById = req.user?.id || 'system';

      const meeting = await prisma.prestartMeeting.create({
        data: {
          meetingDate: new Date(meetingDate),
          staffPresent,
          runById
        },
        include: {
          runBy: {
            select: { id: true, name: true }
          }
        }
      });

      res.status(201).json({ meeting });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ADD JOB TO MEETING
// ============================================

router.post('/:id/jobs',
  param('id').isUUID(),
  body('documentId').isUUID(),
  body('installerName').notEmpty(),
  body('dayType').isIn(['YESTERDAY', 'TODAY']),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { documentId, installerName, dayType, ...complianceData } = req.body;

      // Verify meeting exists
      const meeting = await prisma.prestartMeeting.findUnique({
        where: { id }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Verify document exists
      const document = await prisma.liveDocument.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Try to fetch compliance data from Jobman if job is linked
      let jobmanCompliance = {};
      if (document.jobmanJobId) {
        try {
          // Fetch job tasks/timesheet data from Jobman
          const jobData = await jobman.getJob(document.jobmanJobId);
          // Parse compliance data
          // This would need to be customized based on how you track compliance in Jobman
        } catch (e) {
          console.warn('Could not fetch Jobman job data:', e.message);
        }
      }

      const meetingJob = await prisma.prestartMeetingJob.create({
        data: {
          prestartId: id,
          documentId,
          installerName,
          dayType,
          ...complianceData,
          ...jobmanCompliance
        },
        include: {
          document: {
            select: {
              id: true,
              customerName: true,
              siteAddress: true,
              status: true
            }
          }
        }
      });

      res.status(201).json({ job: meetingJob });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE MEETING (after recording/transcription)
// ============================================

router.put('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const meeting = await prisma.prestartMeeting.update({
        where: { id },
        data: updates,
        include: {
          runBy: {
            select: { id: true, name: true }
          },
          jobs: {
            include: {
              document: true
            }
          }
        }
      });

      res.json({ meeting });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPLOAD RECORDING
// ============================================

router.post('/:id/recording',
  param('id').isUUID(),
  body('recordingUrl').isURL(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { recordingUrl } = req.body;

      const meeting = await prisma.prestartMeeting.update({
        where: { id },
        data: {
          recordingUrl,
          transcriptStatus: 'PROCESSING'
        }
      });

      // TODO: Trigger transcription job
      // This would call Whisper API or similar
      // For now, just mark as processing

      res.json({ 
        meeting,
        message: 'Recording uploaded, transcription processing...' 
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// SAVE TRANSCRIPT & AI SUMMARY
// ============================================

router.put('/:id/transcript',
  param('id').isUUID(),
  body('transcript').isString(),
  body('aiSummary').optional().isObject(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { transcript, aiSummary } = req.body;

      const meeting = await prisma.prestartMeeting.update({
        where: { id },
        data: {
          transcript,
          aiSummary,
          transcriptStatus: 'COMPLETED'
        }
      });

      res.json({ meeting });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET COMPLIANCE DATA FOR A DATE
// ============================================

router.get('/compliance/:date',
  param('date').isISO8601(),
  async (req, res, next) => {
    try {
      const date = new Date(req.params.date);
      
      // Get all active jobs scheduled for this date
      const documents = await prisma.liveDocument.findMany({
        where: {
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS']
          }
        },
        select: {
          id: true,
          customerName: true,
          siteAddress: true,
          jobmanJobId: true
        }
      });

      // Fetch compliance data from Jobman for each job
      const complianceData = [];
      
      for (const doc of documents) {
        if (doc.jobmanJobId) {
          try {
            // Get timesheet/task data from Jobman
            const jobData = await jobman.getJob(doc.jobmanJobId);
            const tasks = await jobman.getJobTasks(doc.jobmanJobId);
            
            complianceData.push({
              documentId: doc.id,
              customerName: doc.customerName,
              siteAddress: doc.siteAddress,
              jobmanJobId: doc.jobmanJobId,
              // Parse actual compliance from Jobman data
              // This is a placeholder structure
              compliance: {
                clockedIn: false,
                clockedOut: false,
                checkedIn: false,
                checkedOut: false,
                photosUploaded: false,
                tasksCompleted: false
              }
            });
          } catch (e) {
            console.warn(`Could not fetch Jobman data for job ${doc.jobmanJobId}:`, e.message);
          }
        }
      }

      res.json({ complianceData });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
