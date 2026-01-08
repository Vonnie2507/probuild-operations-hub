import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Shield,
  Briefcase,
  Edit2
} from 'lucide-react';
import { prestartMeetingApi } from '../api';

// Australian date format helpers
function formatDateAU(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateLong(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    async function loadMeeting() {
      try {
        const { data } = await prestartMeetingApi.getById(id);
        setMeeting(data.meeting);
      } catch (err) {
        console.error('Failed to load meeting:', err);
        setError('Failed to load meeting.');
      } finally {
        setLoading(false);
      }
    }
    loadMeeting();
  }, [id]);

  async function handleReopen() {
    setReopening(true);
    try {
      const { data } = await prestartMeetingApi.reopen(id);
      // Navigate to the edit page
      navigate('/prestart-meeting');
    } catch (err) {
      console.error('Failed to reopen meeting:', err);
      setError('Failed to reopen meeting.');
    } finally {
      setReopening(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
        Meeting not found.
      </div>
    );
  }

  const getContent = (sectionType) => {
    return meeting.content?.find(c => c.sectionType === sectionType)?.content || '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/meeting-history"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-orange-500" />
              Pre-Start Meeting
            </h1>
            <p className="text-gray-500 mt-1">{formatDateLong(meeting.meetingDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {meeting.wasEdited && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
              <Edit2 className="w-4 h-4" />
              Edited
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              meeting.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {meeting.status === 'completed' ? 'Completed' : 'Draft'}
          </span>
          {meeting.status === 'completed' && (
            <button
              onClick={handleReopen}
              disabled={reopening}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
            >
              {reopening ? 'Reopening...' : 'Edit Meeting'}
            </button>
          )}
        </div>
      </div>

      {/* Meeting Info Card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Run By</p>
            <p className="font-medium">{meeting.runBy?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Start Time</p>
            <p className="font-medium">{formatTime(meeting.startTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">End Time</p>
            <p className="font-medium">{meeting.endTime ? formatTime(meeting.endTime) : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Duration</p>
            <p className="font-medium">
              {meeting.formattedDuration || '-'}
            </p>
          </div>
        </div>

        {/* Attendees */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Attendees</p>
          <div className="flex flex-wrap gap-2">
            {meeting.attendees?.map(a => (
              <span
                key={a.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {a.staff?.name}
              </span>
            )) || <span className="text-gray-400">No attendees recorded</span>}
          </div>
        </div>
      </div>

      {/* Yesterday's Jobs Review */}
      {meeting.yesterdayReviews?.length > 0 && (
        <Section title="Yesterday's Jobs Review" icon={<Briefcase className="w-5 h-5" />}>
          <div className="space-y-3">
            {meeting.yesterdayReviews.map(review => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{review.staff?.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">
                    {review.staff?.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Job</p>
                    <p>{review.jobDescription || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Stage Left At</p>
                    <p>{review.stageLeftAt || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Notes</p>
                    <p>{review.notes || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Challenge & Learning */}
      {(getContent('challenge') || getContent('resolution')) && (
        <Section title="Challenge & Learning" icon={<AlertTriangle className="w-5 h-5" />}>
          {getContent('challenge') && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Challenge</p>
              <p className="whitespace-pre-wrap">{getContent('challenge')}</p>
            </div>
          )}
          {getContent('resolution') && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Resolution</p>
              <p className="whitespace-pre-wrap">{getContent('resolution')}</p>
            </div>
          )}
        </Section>
      )}

      {/* Yesterday's Win */}
      {getContent('win') && (
        <Section title="Yesterday's Win" icon={<Trophy className="w-5 h-5" />}>
          <p className="whitespace-pre-wrap">{getContent('win')}</p>
        </Section>
      )}

      {/* Compliance Check */}
      {meeting.complianceChecks?.length > 0 && (
        <Section title="Compliance Check" icon={<CheckCircle className="w-5 h-5" />}>
          <div className="space-y-3">
            {/* Group by staff */}
            {Object.entries(
              meeting.complianceChecks.reduce((acc, check) => {
                const staffName = check.staff?.name || 'Unknown';
                if (!acc[staffName]) acc[staffName] = [];
                acc[staffName].push(check);
                return acc;
              }, {})
            ).map(([staffName, checks]) => (
              <div key={staffName} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">{staffName}</p>
                <div className="flex flex-wrap gap-2">
                  {checks.map(check => (
                    <span
                      key={check.id}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        check.completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {check.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-current" />
                      )}
                      {check.checkType.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Safety Talk */}
      {getContent('safetyTalk') && (
        <Section title="Safety Talk" icon={<Shield className="w-5 h-5" />}>
          <p className="whitespace-pre-wrap">{getContent('safetyTalk')}</p>
        </Section>
      )}

      {/* Today's Jobs Briefing */}
      {getContent('todaysJobs') && (
        <Section title="Today's Jobs Briefing" icon={<Briefcase className="w-5 h-5" />}>
          <p className="whitespace-pre-wrap">{getContent('todaysJobs')}</p>
        </Section>
      )}

      {/* Meeting Close */}
      {meeting.closeChecks && (
        <Section title="Meeting Close" icon={<CheckCircle className="w-5 h-5" />}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {meeting.closeChecks.understandJobs ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span>Everyone understands their jobs for today</span>
            </div>
            <div className="flex items-center gap-2">
              {meeting.closeChecks.haveToolsMaterials ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span>Everyone has the tools and materials they need</span>
            </div>
            <div className="flex items-center gap-2">
              {meeting.closeChecks.questionsAddressed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span>All questions have been addressed</span>
            </div>
          </div>
        </Section>
      )}

      {/* Edit Log */}
      {meeting.editLog && meeting.editLog.length > 0 && (
        <Section title="Edit History" icon={<Edit2 className="w-5 h-5" />}>
          <div className="space-y-2">
            {meeting.editLog.map((log, idx) => (
              <div key={idx} className="text-sm text-gray-600">
                <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                <span className="text-gray-400 ml-2">
                  {formatDateAU(log.editedAt)} {formatTime(log.editedAt)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100">
        <div className="text-orange-500">{icon}</div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
