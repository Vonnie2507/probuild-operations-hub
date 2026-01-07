import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, Clock, ChevronRight, PlayCircle } from 'lucide-react';
import { prestartApi } from '../api';
import { format } from 'date-fns';

export default function Prestart() {
  const [meetings, setMeetings] = useState([]);
  const [todayMeeting, setTodayMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Check for today's meeting
      try {
        const { data } = await prestartApi.getToday();
        // Only set if it has an actual ID (exists in database)
        if (data.meeting && data.meeting.id) {
          setTodayMeeting(data.meeting);
        }
      } catch (err) {
        // No meeting today - that's okay
      }

      // Get all meetings
      const { data } = await prestartApi.getAll({ limit: 20 });
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startTodaysMeeting() {
    try {
      const { data } = await prestartApi.create({
        meetingDate: new Date().toISOString(),
        staffPresent: [],
      });
      // Backend returns { meeting } so extract it
      const meeting = data.meeting || data;
      navigate(`/prestart/${meeting.id}`);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Start Meetings</h1>
          <p className="text-gray-500 text-sm mt-1">Daily team briefings and job reviews</p>
        </div>
      </div>

      {/* Today's Meeting Card */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">Today's Meeting</p>
            <h2 className="text-2xl font-bold mt-1">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </h2>
          </div>
          {todayMeeting ? (
            <Link
              to={`/prestart/${todayMeeting.id}`}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Continue Meeting
            </Link>
          ) : (
            <button
              onClick={startTodaysMeeting}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Start Today's Meeting
            </button>
          )}
        </div>
        {todayMeeting && (
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-200" />
              <span className="text-sm">
                {todayMeeting.staffPresent?.length || 0} staff present
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-200" />
              <span className="text-sm">
                {todayMeeting.jobs?.length || 0} jobs discussed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Structure Info */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pre-Start Meeting Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">1. Yesterday's Jobs</h4>
            <p className="text-sm text-blue-700 mt-1">
              Review compliance: clock in/out, check in/out, photos, tasks
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">2. Today's Jobs</h4>
            <p className="text-sm text-green-700 mt-1">
              Assign installers, review site info, discuss challenges
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900">3. Team Updates</h4>
            <p className="text-sm text-purple-700 mt-1">
              Safety topics, wins, challenges, action items
            </p>
          </div>
        </div>
      </div>

      {/* Past Meetings */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Past Meetings</h3>
        </div>
        {meetings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No past meetings yet</p>
            <p className="text-sm mt-1">Start your first pre-start meeting above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                to={`/prestart/${meeting.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(meeting.meetingDate), 'EEEE, d MMMM yyyy')}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {meeting.staffPresent?.length || 0} staff
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meeting.jobs?.length || 0} jobs
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
