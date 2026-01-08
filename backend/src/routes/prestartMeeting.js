/**
 * PROBUILD OPERATIONS HUB
 * Pre-Start Meeting Routes (Simplified)
 *
 * Uses the existing PrestartMeeting model with formData JSON field
 * to store all form data simply.
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Get date-only for today (midnight)
function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Helper: Get tomorrow date (midnight)
function getTomorrowDate() {
  const today = getTodayDate();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

// ============================================
// GET TODAY'S MEETING
// ============================================
router.get('/today', async (req, res, next) => {
  try {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    const meeting = await prisma.prestartMeeting.findFirst({
      where: {
        meetingDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        runBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!meeting) {
      return res.json({
        exists: false,
        meeting: null
      });
    }

    res.json({
      exists: true,
      meeting: {
        id: meeting.id,
        meetingDate: meeting.meetingDate,
        startTime: meeting.createdAt,
        endTime: meeting.formData?.endTime || null,
        durationMinutes: meeting.formData?.durationMinutes || null,
        status: meeting.formData?.status || 'draft',
        formData: meeting.formData,
        runBy: meeting.runBy
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET MEETING HISTORY
// ============================================
router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;

    const [meetings, total] = await Promise.all([
      prisma.prestartMeeting.findMany({
        orderBy: { meetingDate: 'desc' },
        take: limit,
        skip: offset,
        include: {
          runBy: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.prestartMeeting.count()
    ]);

    res.json({
      meetings: meetings.map(m => ({
        id: m.id,
        meetingDate: m.meetingDate,
        status: m.formData?.status || 'draft',
        durationMinutes: m.formData?.durationMinutes,
        runBy: m.runBy,
        formData: m.formData
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET SINGLE MEETING BY ID
// ============================================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.prestartMeeting.findUnique({
      where: { id },
      include: {
        runBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({
      meeting: {
        id: meeting.id,
        meetingDate: meeting.meetingDate,
        startTime: meeting.createdAt,
        endTime: meeting.formData?.endTime || null,
        durationMinutes: meeting.formData?.durationMinutes || null,
        status: meeting.formData?.status || 'draft',
        formData: meeting.formData,
        runBy: meeting.runBy
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CREATE NEW MEETING
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const { runById, formData, startTime, status, endTime, durationMinutes } = req.body;

    // Get a valid user ID for runBy
    let userId = null;

    // Try to find user by name if runById looks like a name
    if (runById && !runById.includes('-')) {
      const user = await prisma.user.findFirst({
        where: { name: runById }
      });
      userId = user?.id;
    }

    // If not found, use first admin user
    if (!userId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true }
      });
      userId = admin?.id;
    }

    if (!userId) {
      return res.status(400).json({ error: 'No valid user found' });
    }

    const today = getTodayDate();

    // Check if meeting already exists for today
    const existing = await prisma.prestartMeeting.findFirst({
      where: {
        meetingDate: {
          gte: today,
          lt: getTomorrowDate()
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'Meeting already exists for today',
        meetingId: existing.id
      });
    }

    // Create the meeting
    const meeting = await prisma.prestartMeeting.create({
      data: {
        meetingDate: today,
        runById: userId,
        staffPresent: formData?.staffPresent || [],
        formData: {
          ...formData,
          startTime: startTime || new Date().toISOString(),
          status: status || 'draft',
          endTime: endTime || null,
          durationMinutes: durationMinutes || null
        }
      },
      include: {
        runBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      meeting: {
        id: meeting.id,
        meetingDate: meeting.meetingDate,
        startTime: meeting.formData?.startTime,
        status: meeting.formData?.status,
        formData: meeting.formData,
        runBy: meeting.runBy
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE MEETING
// ============================================
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { formData, status, endTime, durationMinutes } = req.body;

    // Get existing meeting
    const existing = await prisma.prestartMeeting.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Merge form data
    const updatedFormData = {
      ...(existing.formData || {}),
      ...(formData || {}),
      status: status || formData?.status || existing.formData?.status || 'draft',
      endTime: endTime || formData?.endTime || existing.formData?.endTime,
      durationMinutes: durationMinutes || formData?.durationMinutes || existing.formData?.durationMinutes
    };

    const meeting = await prisma.prestartMeeting.update({
      where: { id },
      data: {
        staffPresent: formData?.staffPresent || existing.staffPresent,
        formData: updatedFormData
      },
      include: {
        runBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      meeting: {
        id: meeting.id,
        meetingDate: meeting.meetingDate,
        startTime: meeting.formData?.startTime,
        endTime: meeting.formData?.endTime,
        durationMinutes: meeting.formData?.durationMinutes,
        status: meeting.formData?.status,
        formData: meeting.formData,
        runBy: meeting.runBy
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// STAFF ENDPOINTS (Simple - for future use)
// ============================================
router.get('/staff', async (req, res, next) => {
  try {
    // Return hardcoded staff for now - can be made dynamic later
    const staff = [
      { id: 'craig', name: 'Craig', role: 'operations' },
      { id: 'jake', name: 'Jake', role: 'field_installer' },
      { id: 'jarred', name: 'Jarred', role: 'field_installer' },
      { id: 'george', name: 'George', role: 'workshop' },
      { id: 'david', name: 'David', role: 'field_installer' },
      { id: 'dave', name: 'Dave', role: 'field_installer' },
      { id: 'bradley', name: 'Bradley', role: 'field_installer' },
      { id: 'vonnie', name: 'Vonnie', role: 'admin' },
    ];
    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
