/**
 * PROBUILD OPERATIONS HUB
 * File Upload Routes
 * 
 * Handles file uploads to Cloudflare R2 storage
 * and links them to Live Documents
 */

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// CLOUDFLARE R2 CONFIG
// ============================================

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'probuild-files';
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// ============================================
// MULTER CONFIG (for handling file uploads)
// ============================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCUMENT';
  return 'OTHER';
}

function generateS3Key(documentId, filename) {
  const ext = path.extname(filename);
  const uniqueId = uuidv4();
  return `documents/${documentId}/${uniqueId}${ext}`;
}

// ============================================
// UPLOAD FILE TO DOCUMENT
// ============================================

router.post('/document/:documentId',
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const { section = 'GENERAL', description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Verify document exists
      const document = await prisma.liveDocument.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Generate S3 key
      const s3Key = generateS3Key(documentId, file.originalname);

      // Upload to R2
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      // Generate public URL
      const fileUrl = `${PUBLIC_URL}/${s3Key}`;

      // TODO: Get actual user from auth middleware
      const uploadedById = req.user?.id || 'system';

      // Save file record to database
      const fileRecord = await prisma.documentFile.create({
        data: {
          documentId,
          fileName: file.originalname,
          fileType: getFileType(file.mimetype),
          fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          section,
          description,
          uploadedById
        }
      });

      res.status(201).json({ file: fileRecord });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPLOAD MULTIPLE FILES
// ============================================

router.post('/document/:documentId/batch',
  upload.array('files', 10), // Max 10 files at once
  async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const { section = 'GENERAL' } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      // Verify document exists
      const document = await prisma.liveDocument.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // TODO: Get actual user from auth middleware
      const uploadedById = req.user?.id || 'system';

      const uploadedFiles = [];

      for (const file of files) {
        // Generate S3 key
        const s3Key = generateS3Key(documentId, file.originalname);

        // Upload to R2
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype
        }));

        // Generate public URL
        const fileUrl = `${PUBLIC_URL}/${s3Key}`;

        // Save file record
        const fileRecord = await prisma.documentFile.create({
          data: {
            documentId,
            fileName: file.originalname,
            fileType: getFileType(file.mimetype),
            fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            section,
            uploadedById
          }
        });

        uploadedFiles.push(fileRecord);
      }

      res.status(201).json({ files: uploadedFiles });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// LIST FILES FOR DOCUMENT
// ============================================

router.get('/document/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { section } = req.query;

    const where = { documentId };
    if (section) {
      where.section = section;
    }

    const files = await prisma.documentFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({ files });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE FILE
// ============================================

router.delete('/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.documentFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Extract S3 key from URL
    const urlParts = file.fileUrl.split('/');
    const s3Key = urlParts.slice(-3).join('/'); // documents/docId/filename

    // Delete from R2
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      }));
    } catch (e) {
      console.warn('Could not delete from R2:', e.message);
      // Continue anyway - delete the database record
    }

    // Delete database record
    await prisma.documentFile.delete({
      where: { id: fileId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE FILE METADATA
// ============================================

router.put('/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { section, description } = req.body;

    const file = await prisma.documentFile.update({
      where: { id: fileId },
      data: {
        ...(section && { section }),
        ...(description !== undefined && { description })
      }
    });

    res.json({ file });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'File not found' });
    }
    next(error);
  }
});

// ============================================
// UPLOAD PRESTART RECORDING
// ============================================

router.post('/prestart/:prestartId/recording',
  upload.single('recording'),
  async (req, res, next) => {
    try {
      const { prestartId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No recording provided' });
      }

      // Verify prestart meeting exists
      const prestart = await prisma.prestartMeeting.findUnique({
        where: { id: prestartId }
      });

      if (!prestart) {
        return res.status(404).json({ error: 'Pre-start meeting not found' });
      }

      // Generate S3 key for recordings
      const s3Key = `prestart-recordings/${prestartId}/${uuidv4()}${path.extname(file.originalname)}`;

      // Upload to R2
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      // Generate public URL
      const recordingUrl = `${PUBLIC_URL}/${s3Key}`;

      // Update prestart meeting with recording URL
      const updated = await prisma.prestartMeeting.update({
        where: { id: prestartId },
        data: {
          recordingUrl,
          transcriptStatus: 'PROCESSING'
        }
      });

      // TODO: Trigger transcription job here
      // This would call Whisper API or similar service

      res.json({ 
        prestart: updated,
        message: 'Recording uploaded. Transcription will begin shortly.' 
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
