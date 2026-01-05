# 🟠 PROBUILD OPERATIONS HUB

A document and form management system for Probuild PVC.

**What you can do:**
- Create and store **templates** (Live Project Documents, Pre-Start Meetings, Checklists, etc.)
- Create **documents** from templates for each job/customer
- Define **meeting structures** with custom sections
- Upload **files** (photos, videos, PDFs) attached to documents
- **Optionally** connect to Jobman to pull/push customer and job data

## 📁 Project Structure

```
probuild-hub/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main Express server
│   │   ├── services/
│   │   │   └── jobman.js         # Jobman API integration
│   │   └── routes/
│   │       ├── auth.js           # User authentication
│   │       ├── documents.js      # Live Project Documents CRUD
│   │       ├── prestart.js       # Pre-Start Meetings
│   │       ├── jobman.js         # Jobman API proxy
│   │       ├── webhooks.js       # Jobman webhook receiver
│   │       └── files.js          # File uploads (Cloudflare R2)
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── .env.example              # Environment variables template
│   └── package.json
└── frontend/                     # (To be built)
    └── src/
```

## 🔗 Jobman Integration

### What we pull FROM Jobman:
- Contacts (name, email, phone, address)
- Leads (site info, status)
- Quotes (status, items, pricing)
- Jobs (status, tasks, scheduling)
- Staff (timesheets, clock in/out)
- Catalogue (materials, products)

### What we push TO Jobman:
- Create new leads
- Update contact info
- Link quotes and jobs
- Upload files

### What we store OURSELVES (not in Jobman):
- Site access details
- Parking information
- Ground conditions
- Existing fence details
- DBYD references
- Custom fields (anything you need!)
- Photos and videos
- Pre-start meeting recordings
- AI transcripts and summaries
- Change history / audit trail

## 🚀 Setup Instructions

### 1. Get Your Jobman API Credentials

1. Go to https://identity.jobmanapp.com/
2. Click "Developer" → "Personal Access Tokens"
3. Create a new token with full access
4. Copy the token - you'll only see it once!
5. Find your Organisation ID from any Jobman URL or API response

### 2. Set Up Cloudflare R2 (File Storage)

1. Log in to Cloudflare Dashboard
2. Go to R2 → Create Bucket → Name it `probuild-files`
3. Create API Token with Object Read & Write permissions
4. Note down: Account ID, Access Key ID, Secret Access Key

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
```
JOBMAN_API_KEY=your_personal_access_token
JOBMAN_ORGANISATION_ID=your_org_uuid
DATABASE_URL=postgresql://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=probuild-files
R2_PUBLIC_URL=https://your-bucket-url
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Set Up Database

```bash
npx prisma generate
npx prisma db push
```

### 6. Run the Server

```bash
npm run dev
```

Server will start at http://localhost:3001

## 📡 API Endpoints

### Documents (Live Project Documents)
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `PUT /api/documents/:id/status` - Update status
- `POST /api/documents/:id/link-jobman` - Link to Jobman lead/quote/job
- `POST /api/documents/:id/custom-field` - Add custom field
- `GET /api/documents/:id/history` - Get change history

### Pre-Start Meetings
- `GET /api/prestart/today` - Get today's meeting
- `GET /api/prestart` - List all meetings
- `POST /api/prestart` - Create meeting
- `POST /api/prestart/:id/jobs` - Add job to meeting
- `POST /api/prestart/:id/recording` - Upload recording

### Files
- `POST /api/files/document/:id` - Upload file to document
- `GET /api/files/document/:id` - List files for document
- `DELETE /api/files/:fileId` - Delete file

### Jobman Proxy (secure - API key stays on server)
- `GET /api/jobman/leads` - List Jobman leads
- `GET /api/jobman/quotes` - List Jobman quotes
- `GET /api/jobman/jobs` - List Jobman jobs
- `GET /api/jobman/staff` - List staff
- Plus many more...

### Webhooks
- `POST /api/webhooks/jobman` - Receive Jobman webhooks

## 🔄 Jobman Webhook Setup

To receive real-time updates from Jobman:

1. In Jobman, go to Settings → Webhooks
2. Create endpoint: `https://your-railway-url.up.railway.app/api/webhooks/jobman`
3. Select events:
   - lead.created, lead.updated, lead.status_changed
   - quote.created, quote.updated, quote.status_changed
   - job.created, job.updated, job.status_changed
4. Copy the Signing Secret to your `.env` as `JOBMAN_WEBHOOK_SECRET`

## 🚂 Deploy to Railway

1. Push code to GitHub
2. Create new project in Railway
3. Add PostgreSQL database
4. Connect GitHub repo
5. Add environment variables
6. Deploy!

## 🔧 Next Steps

1. **Build the frontend** - React app with the UI mockup we designed
2. **Add AI transcription** - Integrate Whisper API for pre-start recordings
3. **Set up webhooks** - Configure Jobman to send updates
4. **Test the flow** - Create a document, link to Jobman, upload files

## 📝 Custom Fields Example

You can add ANY field you need that Jobman doesn't have:

```javascript
// POST /api/documents/:id/custom-field
{
  "fieldName": "dog_on_property",
  "fieldValue": "Yes - Golden Retriever named Max, friendly"
}

{
  "fieldName": "council_approval_number",
  "fieldValue": "BA-2026-1234"
}

{
  "fieldName": "preferred_install_days",
  "fieldValue": ["Monday", "Tuesday", "Wednesday"]
}
```

These are stored as JSON and can be anything you need!
