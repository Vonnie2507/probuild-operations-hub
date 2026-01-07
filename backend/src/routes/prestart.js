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
// GET JOBMAN DATA FOR PRE-START MEETING
// (Must be before /:id route to avoid conflict)
// ============================================

router.get('/jobman-data',
  async (req, res, next) => {
    try {
      // Get today and yesterday dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch data from Jobman
      let todaysJobs = [];
      let yesterdaysJobs = [];
      let staff = [];

      try {
        // Get all staff - Jobman returns {staff: {data: [...]}}
        const staffResponse = await jobman.listStaff({ limit: 50 });
        if (staffResponse?.staff?.data && Array.isArray(staffResponse.staff.data)) {
          staff = staffResponse.staff.data;
        } else if (staffResponse?.data && Array.isArray(staffResponse.data)) {
          staff = staffResponse.data;
        } else if (Array.isArray(staffResponse)) {
          staff = staffResponse;
        } else {
          staff = [];
        }

        // Get jobs - Jobman returns {jobs: {data: [...]}}
        const allJobs = await jobman.listJobs({ limit: 100 });
        let jobs = [];
        if (allJobs?.jobs?.data && Array.isArray(allJobs.jobs.data)) {
          jobs = allJobs.jobs.data;
        } else if (allJobs?.data && Array.isArray(allJobs.data)) {
          jobs = allJobs.data;
        } else if (Array.isArray(allJobs)) {
          jobs = allJobs;
        }

        // For each job, get tasks and members to determine scheduling
        for (const job of jobs) {
          try {
            const [tasksRes, membersRes] = await Promise.all([
              jobman.getJobTasks(job.id),
              jobman.getJobMembers(job.id)
            ]);

            // Handle nested response structures from Jobman
            let tasks = [];
            if (tasksRes?.tasks?.data && Array.isArray(tasksRes.tasks.data)) {
              tasks = tasksRes.tasks.data;
            } else if (tasksRes?.data && Array.isArray(tasksRes.data)) {
              tasks = tasksRes.data;
            } else if (Array.isArray(tasksRes)) {
              tasks = tasksRes;
            }

            let members = [];
            if (membersRes?.members?.data && Array.isArray(membersRes.members.data)) {
              members = membersRes.members.data;
            } else if (membersRes?.data && Array.isArray(membersRes.data)) {
              members = membersRes.data;
            } else if (Array.isArray(membersRes)) {
              members = membersRes;
            }

            // Check if any task is scheduled for today or yesterday
            for (const task of tasks) {
              const targetDate = task.target_date ? new Date(task.target_date) : null;
              if (!targetDate) continue;

              const jobData = {
                id: job.id,
                number: job.number,
                description: job.description,
                site_address: job.site_address || '',
                site_address_line1: job.site_address_line1 || '',
                site_address_city: job.site_address_city || '',
                contact_name: job.contact?.name || '',
                contact_phone: job.contact?.phone || '',
                status: job.status?.name || '',
                members: members.map(m => ({
                  id: m.staff?.id || m.id,
                  name: m.staff?.name || m.name || 'Unknown'
                })),
                task: {
                  id: task.id,
                  name: task.name,
                  target_date: task.target_date,
                  progress: task.progress || 0
                }
              };

              // Check if task is for today
              if (targetDate >= today && targetDate < tomorrow) {
                todaysJobs.push(jobData);
              }
              // Check if task is for yesterday
              else if (targetDate >= yesterday && targetDate < today) {
                yesterdaysJobs.push(jobData);
              }
            }
          } catch (e) {
            console.warn(`Could not fetch details for job ${job.id}:`, e.message);
          }
        }
      } catch (e) {
        console.warn('Could not fetch Jobman data:', e.message);
      }

      // Filter staff by role - get installers (those with "Installation" role)
      const installers = staff.filter(s =>
        s.roles && s.roles.some(r => r.name === 'Installation')
      );

      // Build pre-fill data for the form - field names match template placeholders
      const prefillData = {
        // Meta fields - match template {{ field_name }} placeholders
        todays_date: today.toISOString().split('T')[0],
        meeting_start_time: '06:00',
        meeting_end_time: '',
        run_by: staff[0]?.name || '', // Default to first staff member
        staff_present: staff.map(s => s.name).join(', '),

        // Yesterday's jobs - Installer 1 (use installers list, fallback to job members)
        installer1_name: installers[0]?.name || yesterdaysJobs[0]?.members[0]?.name || '',
        installer1_yesterday_job: yesterdaysJobs[0] ? `${yesterdaysJobs[0].number || ''} - ${yesterdaysJobs[0].contact_name?.split(' ')[0] || ''}`.trim().replace(/^-\s*$/, '') : '',
        installer1_stage: yesterdaysJobs[0]?.task?.name || '',
        installer1_yesterday_notes: '',

        // Yesterday's jobs - Installer 2
        installer2_name: installers[1]?.name || yesterdaysJobs[1]?.members[0]?.name || '',
        installer2_yesterday_job: yesterdaysJobs[1] ? `${yesterdaysJobs[1].number || ''} - ${yesterdaysJobs[1].contact_name?.split(' ')[0] || ''}`.trim().replace(/^-\s*$/, '') : '',
        installer2_stage: yesterdaysJobs[1]?.task?.name || '',
        installer2_yesterday_notes: '',

        // Yesterday's jobs - Installer 3
        installer3_name: installers[2]?.name || yesterdaysJobs[2]?.members[0]?.name || '',
        installer3_yesterday_job: yesterdaysJobs[2] ? `${yesterdaysJobs[2].number || ''} - ${yesterdaysJobs[2].contact_name?.split(' ')[0] || ''}`.trim().replace(/^-\s*$/, '') : '',
        installer3_stage: yesterdaysJobs[2]?.task?.name || '',
        installer3_yesterday_notes: '',

        // Today's jobs - Installer 1
        installer1_job1_address: todaysJobs[0]?.site_address || todaysJobs[0]?.site_address_line1 || '',
        installer1_job1_scope: todaysJobs[0]?.description || todaysJobs[0]?.task?.name || '',
        installer1_job2_address: todaysJobs.length > 3 ? (todaysJobs[3]?.site_address || '') : '',
        installer1_job2_scope: todaysJobs.length > 3 ? (todaysJobs[3]?.description || '') : '',
        installer1_special_notes: '',

        // Today's jobs - Installer 2
        installer2_job1_address: todaysJobs[1]?.site_address || todaysJobs[1]?.site_address_line1 || '',
        installer2_job1_scope: todaysJobs[1]?.description || todaysJobs[1]?.task?.name || '',
        installer2_job2_address: todaysJobs.length > 4 ? (todaysJobs[4]?.site_address || '') : '',
        installer2_job2_scope: todaysJobs.length > 4 ? (todaysJobs[4]?.description || '') : '',
        installer2_special_notes: '',

        // Today's jobs - Installer 3
        installer3_job1_address: todaysJobs[2]?.site_address || todaysJobs[2]?.site_address_line1 || '',
        installer3_job1_scope: todaysJobs[2]?.description || todaysJobs[2]?.task?.name || '',
        installer3_job2_address: todaysJobs.length > 5 ? (todaysJobs[5]?.site_address || '') : '',
        installer3_job2_scope: todaysJobs.length > 5 ? (todaysJobs[5]?.description || '') : '',
        installer3_special_notes: '',

        // Safety & other sections (manual entry)
        safety_topic: '',
        safety_notes: '',
        challenge_description: '',
        win_description: '',
        compliance_notes: '',
      };

      res.json({
        todaysJobs,
        yesterdaysJobs,
        staff,
        installers, // Staff with "Installation" role
        prefillData
      });
    } catch (error) {
      next(error);
    }
  }
);

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

      // Get user ID - from auth or find default admin user
      let runById = req.user?.id;

      if (!runById) {
        // Find the first admin user as fallback
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN', isActive: true },
          select: { id: true }
        });

        if (!adminUser) {
          return res.status(400).json({
            error: 'No admin user found. Please run database seed.'
          });
        }

        runById = adminUser.id;
      }

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
