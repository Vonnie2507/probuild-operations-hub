import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  ClipboardCheck,
  AlertTriangle,
  Trophy,
  Shield,
  Mic,
} from 'lucide-react';
import { prestartApi, documentsApi } from '../api';
import { format } from 'date-fns';

const complianceChecks = [
  { key: 'clockedIn', label: 'Clocked In', icon: Clock },
  { key: 'clockedOut', label: 'Clocked Out', icon: Clock },
  { key: 'checkedIn', label: 'Checked In', icon: ClipboardCheck },
  { key: 'checkedOut', label: 'Checked Out', icon: ClipboardCheck },
  { key: 'photosUploaded', label: 'Photos', icon: Camera },
  { key: 'tasksCompleted', label: 'Tasks Done', icon: CheckCircle },
];

export default function PrestartDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [newStaff, setNewStaff] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [meetingRes, docsRes] = await Promise.all([
        prestartApi.getById(id),
        documentsApi.getAll({ status: 'IN_PROGRESS,SCHEDULED', limit: 50 }),
      ]);
      // Backend returns { meeting } so extract it
      setMeeting(meetingRes.data.meeting || meetingRes.data);
      setDocuments(docsRes.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await prestartApi.update(id, {
        staffPresent: meeting.staffPresent,
        manualNotes: meeting.manualNotes,
      });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  }

  function addStaff() {
    if (newStaff.trim() && !meeting.staffPresent.includes(newStaff.trim())) {
      setMeeting((prev) => ({
        ...prev,
        staffPresent: [...prev.staffPresent, newStaff.trim()],
      }));
      setNewStaff('');
    }
  }

  function removeStaff(name) {
    setMeeting((prev) => ({
      ...prev,
      staffPresent: prev.staffPresent.filter((s) => s !== name),
    }));
  }

  async function addJobToMeeting(dayType) {
    if (!selectedDoc) return;
    try {
      await prestartApi.addJob(id, {
        documentId: selectedDoc,
        dayType,
        installerName: 'TBD',
      });
      await fetchData();
      setShowAddJob(false);
      setSelectedDoc('');
    } catch (error) {
      console.error('Failed to add job:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Meeting not found</p>
        <Link to="/prestart" className="text-orange-500 hover:underline mt-2 inline-block">
          Back to meetings
        </Link>
      </div>
    );
  }

  const yesterdayJobs = meeting.jobs?.filter((j) => j.dayType === 'YESTERDAY') || [];
  const todayJobs = meeting.jobs?.filter((j) => j.dayType === 'TODAY') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/prestart" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pre-Start Meeting</h1>
            <p className="text-gray-500">
              {format(new Date(meeting.meetingDate), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Meeting'}
        </button>
      </div>

      {/* Staff Present */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Staff Present</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {meeting.staffPresent?.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              {name}
              <button
                onClick={() => removeStaff(name)}
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStaff}
            onChange={(e) => setNewStaff(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStaff()}
            placeholder="Add staff member..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <button
            onClick={addStaff}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Yesterday's Jobs */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-900">Yesterday's Jobs</h2>
            <button
              onClick={() => {
                setShowAddJob(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Job
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-1">Review compliance and any outstanding issues</p>
        </div>
        {yesterdayJobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No jobs from yesterday added yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {yesterdayJobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {job.document?.customerName || 'Unknown Customer'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {job.document?.siteAddress || 'No address'}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      Installer: {job.installerName}
                    </p>
                  </div>
                  <Link
                    to={`/documents/${job.documentId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Document
                  </Link>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {complianceChecks.map((check) => (
                    <div
                      key={check.key}
                      className={`flex flex-col items-center p-2 rounded-lg ${
                        job[check.key]
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {job[check.key] ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="text-xs mt-1">{check.label}</span>
                    </div>
                  ))}
                </div>
                {job.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {job.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Jobs */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">Today's Jobs</h2>
            <button
              onClick={() => setShowAddJob(true)}
              className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Job
            </button>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Review site details and assign installers
          </p>
        </div>
        {todayJobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No jobs scheduled for today yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {todayJobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {job.document?.customerName || 'Unknown Customer'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {job.document?.siteAddress || 'No address'}
                    </p>
                  </div>
                  <Link
                    to={`/documents/${job.documentId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {job.document?.siteAccess && (
                    <div>
                      <span className="font-medium text-gray-700">Site Access:</span>
                      <p className="text-gray-600">{job.document.siteAccess}</p>
                    </div>
                  )}
                  {job.document?.parkingDetails && (
                    <div>
                      <span className="font-medium text-gray-700">Parking:</span>
                      <p className="text-gray-600">{job.document.parkingDetails}</p>
                    </div>
                  )}
                  {job.document?.dogOnProperty && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-4 h-4" />
                      Dog on property: {job.document.dogDetails || 'Yes'}
                    </div>
                  )}
                  {job.document?.specialRequirements && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Special Requirements:</span>
                      <p className="text-gray-600">{job.document.specialRequirements}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Updates Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Challenges */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">Challenges</h3>
          </div>
          <textarea
            placeholder="Any challenges or issues to discuss..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>

        {/* Wins */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">Wins</h3>
          </div>
          <textarea
            placeholder="Celebrate any wins or achievements..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>

        {/* Safety */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Safety Topics</h3>
          </div>
          <textarea
            placeholder="Safety reminders or topics..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>
      </div>

      {/* Meeting Notes */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Meeting Notes</h3>
        </div>
        <textarea
          value={meeting.manualNotes || ''}
          onChange={(e) =>
            setMeeting((prev) => ({ ...prev, manualNotes: e.target.value }))
          }
          placeholder="Additional meeting notes..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Add Job Modal */}
      {showAddJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Job to Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Document
                </label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Choose a document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.customerName} - {doc.siteAddress}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => addJobToMeeting('YESTERDAY')}
                  disabled={!selectedDoc}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Add to Yesterday
                </button>
                <button
                  onClick={() => addJobToMeeting('TODAY')}
                  disabled={!selectedDoc}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  Add to Today
                </button>
              </div>
              <button
                onClick={() => {
                  setShowAddJob(false);
                  setSelectedDoc('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
