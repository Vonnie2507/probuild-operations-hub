import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Edit2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { prestartMeetingApi } from '../api';

// Australian date format helper
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

export default function MeetingHistory() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  const limit = 20;

  useEffect(() => {
    async function loadMeetings() {
      setLoading(true);
      try {
        const { data } = await prestartMeetingApi.getHistory({
          limit,
          offset: page * limit
        });
        setMeetings(data.meetings);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to load meetings:', err);
        setError('Failed to load meeting history.');
      } finally {
        setLoading(false);
      }
    }
    loadMeetings();
  }, [page]);

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-orange-500" />
            Meeting History
          </h1>
          <p className="text-gray-500 mt-1">{total} meetings recorded</p>
        </div>
        <Link
          to="/prestart-meeting"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          Today's Meeting
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Meetings List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {meetings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No meetings recorded yet.</p>
            <Link
              to="/prestart-meeting"
              className="text-orange-500 hover:underline mt-2 inline-block"
            >
              Start your first meeting
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {meetings.map(meeting => (
              <Link
                key={meeting.id}
                to={`/prestart-meeting/${meeting.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Date Badge */}
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {new Date(meeting.meetingDate).getDate()}
                    </span>
                    <span className="text-xs text-orange-500 uppercase">
                      {new Date(meeting.meetingDate).toLocaleDateString('en-AU', { month: 'short' })}
                    </span>
                  </div>

                  {/* Meeting Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {formatDateLong(meeting.meetingDate)}
                      </p>
                      {meeting.wasEdited && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          Edited
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {meeting.runBy?.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {meeting.attendeeCount} attendees
                      </span>
                      {meeting.formattedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meeting.formattedDuration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Arrow */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      meeting.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {meeting.status === 'completed' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    ) : (
                      'Draft'
                    )}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
