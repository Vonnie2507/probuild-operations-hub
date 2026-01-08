import { useState, useEffect } from 'react';
import { prestartMeetingApi } from '../api';

// Staff lists - hardcoded for simplicity
const ALL_STAFF = ['Craig', 'Jake', 'Jarred', 'George', 'David', 'Dave', 'Bradley', 'Vonnie'];
const FIELD_INSTALLERS = ['Jarred', 'Jake'];
const WORKSHOP_STAFF = ['George'];

// Australian date format
function formatDateAU(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export default function PreStartMeetingNew() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [meetingId, setMeetingId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    runBy: 'Craig',
    staffPresent: [],
    // Yesterday's jobs
    jarredJob: '', jarredStage: '', jarredNotes: '',
    jakeJob: '', jakeStage: '', jakeNotes: '',
    georgeJob: '', georgeStage: '', georgeNotes: '',
    // Challenge & learning
    challenge: '',
    resolution: '',
    // Win
    win: '',
    // Compliance - Field Installers
    jarred_clockedInOut: false, jarred_jobCheckin: false, jarred_progressPhotos: false,
    jarred_tasksTicked: false, jarred_stockCheck: false, jarred_vehicleCleaned: false,
    jake_clockedInOut: false, jake_jobCheckin: false, jake_progressPhotos: false,
    jake_tasksTicked: false, jake_stockCheck: false, jake_vehicleCleaned: false,
    // Compliance - Workshop
    george_clockedInOut: false, george_timerStartStop: false,
    george_qaPhotos: false, george_workshopClean: false,
    // Safety & Today
    safetyTalk: '',
    todaysJobs: '',
    // Close checks
    understandJobs: false,
    haveToolsMaterials: false,
    questionsAddressed: false,
  });

  // Load today's meeting on mount
  useEffect(() => {
    loadTodaysMeeting();
  }, []);

  async function loadTodaysMeeting() {
    try {
      const { data } = await prestartMeetingApi.getToday();
      if (data.exists && data.meeting) {
        const m = data.meeting;
        setMeetingId(m.id);
        setIsCompleted(m.status === 'completed');
        setStartTime(m.startTime);
        setEndTime(m.endTime);
        setDuration(m.durationMinutes);
        // Load form data from meeting
        if (m.formData) {
          setFormData(prev => ({ ...prev, ...m.formData }));
        }
      } else {
        // New meeting - capture start time
        setStartTime(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
      setStartTime(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function toggleStaffPresent(name) {
    setFormData(prev => ({
      ...prev,
      staffPresent: prev.staffPresent.includes(name)
        ? prev.staffPresent.filter(n => n !== name)
        : [...prev.staffPresent, name]
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      if (meetingId) {
        // Update existing
        await prestartMeetingApi.update(meetingId, {
          formData,
          status: 'draft'
        });
      } else {
        // Create new
        const { data } = await prestartMeetingApi.create({
          runById: formData.runBy,
          attendeeIds: [],
          formData,
          startTime
        });
        setMeetingId(data.meeting.id);
      }
      setMessage('Saved!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage('Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseMeeting() {
    if (!formData.understandJobs || !formData.haveToolsMaterials || !formData.questionsAddressed) {
      setMessage('Please check all three confirmation boxes before closing.');
      return;
    }

    setSaving(true);
    setMessage('');
    const closeTime = new Date();
    const durationMins = Math.round((closeTime - new Date(startTime)) / 60000);

    try {
      if (meetingId) {
        await prestartMeetingApi.update(meetingId, {
          formData,
          status: 'completed',
          endTime: closeTime.toISOString(),
          durationMinutes: durationMins
        });
      } else {
        const { data } = await prestartMeetingApi.create({
          runById: formData.runBy,
          attendeeIds: [],
          formData,
          startTime,
          status: 'completed',
          endTime: closeTime.toISOString(),
          durationMinutes: durationMins
        });
        setMeetingId(data.meeting.id);
      }
      setIsCompleted(true);
      setEndTime(closeTime.toISOString());
      setDuration(durationMins);
      setMessage(`Meeting closed! Duration: ${durationMins} minutes`);
    } catch (error) {
      console.error('Failed to close meeting:', error);
      setMessage('Error closing meeting. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleReopenMeeting() {
    setIsCompleted(false);
    setMessage('Meeting reopened for editing.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#E65100]">6AM Pre-Start Meeting</h1>
          {isCompleted && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Completed
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
              {formatDateAU(new Date())}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Meeting run by</label>
            <select
              value={formData.runBy}
              onChange={e => updateField('runBy', e.target.value)}
              disabled={isCompleted}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
            >
              {ALL_STAFF.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Staff present</label>
          <div className="flex flex-wrap gap-2">
            {ALL_STAFF.map(name => (
              <label
                key={name}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.staffPresent.includes(name)
                    ? 'bg-[#E65100] text-white border-[#E65100]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={formData.staffPresent.includes(name)}
                  onChange={() => toggleStaffPresent(name)}
                  disabled={isCompleted}
                  className="sr-only"
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        {startTime && (
          <div className="mt-4 text-sm text-gray-500">
            Started: {formatTime(startTime)}
            {endTime && ` | Ended: ${formatTime(endTime)} | Duration: ${duration} minutes`}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Section 1: Yesterday's Jobs Review */}
      <Section title="1. Yesterday's Jobs Review">
        <div className="space-y-4">
          <JobReviewRow
            name="Jarred"
            job={formData.jarredJob}
            stage={formData.jarredStage}
            notes={formData.jarredNotes}
            onJobChange={v => updateField('jarredJob', v)}
            onStageChange={v => updateField('jarredStage', v)}
            onNotesChange={v => updateField('jarredNotes', v)}
            disabled={isCompleted}
          />
          <JobReviewRow
            name="Jake"
            job={formData.jakeJob}
            stage={formData.jakeStage}
            notes={formData.jakeNotes}
            onJobChange={v => updateField('jakeJob', v)}
            onStageChange={v => updateField('jakeStage', v)}
            onNotesChange={v => updateField('jakeNotes', v)}
            disabled={isCompleted}
          />
          <JobReviewRow
            name="George"
            job={formData.georgeJob}
            stage={formData.georgeStage}
            notes={formData.georgeNotes}
            onJobChange={v => updateField('georgeJob', v)}
            onStageChange={v => updateField('georgeStage', v)}
            onNotesChange={v => updateField('georgeNotes', v)}
            disabled={isCompleted}
          />
        </div>
      </Section>

      {/* Section 2: Challenge & Learning */}
      <Section title="2. Challenge & Learning">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Challenge</label>
            <textarea
              value={formData.challenge}
              onChange={e => updateField('challenge', e.target.value)}
              disabled={isCompleted}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
              placeholder="What challenge did we face?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">How we fixed it</label>
            <textarea
              value={formData.resolution}
              onChange={e => updateField('resolution', e.target.value)}
              disabled={isCompleted}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
              placeholder="How did we resolve it?"
            />
          </div>
        </div>
      </Section>

      {/* Section 3: Yesterday's Win */}
      <Section title="3. Yesterday's Win">
        <textarea
          value={formData.win}
          onChange={e => updateField('win', e.target.value)}
          disabled={isCompleted}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
          placeholder="Share a win from yesterday..."
        />
      </Section>

      {/* Section 4: Compliance Check */}
      <Section title="4. Compliance Check">
        {/* Field Installers */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Field Installers</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4"></th>
                  <th className="text-center py-2 px-2">Clocked in/out</th>
                  <th className="text-center py-2 px-2">Job check-in/out</th>
                  <th className="text-center py-2 px-2">Progress photos</th>
                  <th className="text-center py-2 px-2">Tasks ticked</th>
                  <th className="text-center py-2 px-2">Stock check</th>
                  <th className="text-center py-2 px-2">Vehicle cleaned</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Jarred</td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jarred_clockedInOut} onChange={v => updateField('jarred_clockedInOut', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jarred_jobCheckin} onChange={v => updateField('jarred_jobCheckin', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jarred_progressPhotos} onChange={v => updateField('jarred_progressPhotos', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jarred_tasksTicked} onChange={v => updateField('jarred_tasksTicked', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jarred_stockCheck} onChange={v => updateField('jarred_stockCheck', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jarred_vehicleCleaned} onChange={v => updateField('jarred_vehicleCleaned', v)} disabled={isCompleted} /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Jake</td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jake_clockedInOut} onChange={v => updateField('jake_clockedInOut', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jake_jobCheckin} onChange={v => updateField('jake_jobCheckin', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jake_progressPhotos} onChange={v => updateField('jake_progressPhotos', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jake_tasksTicked} onChange={v => updateField('jake_tasksTicked', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jake_stockCheck} onChange={v => updateField('jake_stockCheck', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.jake_vehicleCleaned} onChange={v => updateField('jake_vehicleCleaned', v)} disabled={isCompleted} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Workshop */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Workshop</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4"></th>
                  <th className="text-center py-2 px-2">Clocked in/out</th>
                  <th className="text-center py-2 px-2">Timer start/stop</th>
                  <th className="text-center py-2 px-2">QA photos</th>
                  <th className="text-center py-2 px-2">Workshop clean</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 pr-4 font-medium">George</td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.george_clockedInOut} onChange={v => updateField('george_clockedInOut', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.george_timerStartStop} onChange={v => updateField('george_timerStartStop', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.george_qaPhotos} onChange={v => updateField('george_qaPhotos', v)} disabled={isCompleted} /></td>
                  <td className="text-center py-2 px-2"><Checkbox checked={formData.george_workshopClean} onChange={v => updateField('george_workshopClean', v)} disabled={isCompleted} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Section 5: Safety Talk */}
      <Section title="5. Safety Talk">
        <textarea
          value={formData.safetyTalk}
          onChange={e => updateField('safetyTalk', e.target.value)}
          disabled={isCompleted}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
          placeholder="The safety talk will develop over the next couple of weeks as we implement the new job planning system."
        />
      </Section>

      {/* Section 6: Today's Jobs Briefing */}
      <Section title="6. Today's Jobs Briefing">
        <p className="text-sm text-gray-500 mb-2">
          The boys have their printed job sheets. Note any key points discussed about today's work.
        </p>
        <textarea
          value={formData.todaysJobs}
          onChange={e => updateField('todaysJobs', e.target.value)}
          disabled={isCompleted}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
          placeholder="Key points discussed..."
        />
      </Section>

      {/* Section 7: Meeting Close */}
      <Section title="7. Meeting Close">
        <div className="space-y-3 mb-6">
          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
            formData.understandJobs ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
          } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={formData.understandJobs}
              onChange={e => updateField('understandJobs', e.target.checked)}
              disabled={isCompleted}
              className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
            />
            <span>Everyone understands their jobs for today</span>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
            formData.haveToolsMaterials ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
          } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={formData.haveToolsMaterials}
              onChange={e => updateField('haveToolsMaterials', e.target.checked)}
              disabled={isCompleted}
              className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
            />
            <span>Everyone has the tools and materials they need</span>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
            formData.questionsAddressed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
          } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={formData.questionsAddressed}
              onChange={e => updateField('questionsAddressed', e.target.checked)}
              disabled={isCompleted}
              className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
            />
            <span>All questions have been addressed</span>
          </label>
        </div>

        {!isCompleted ? (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleCloseMeeting}
              disabled={saving}
              className="flex-1 py-3 bg-[#E65100] text-white rounded-lg font-medium hover:bg-[#BF4400] disabled:opacity-50"
            >
              {saving ? 'Closing...' : 'Close Meeting'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleReopenMeeting}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Edit Meeting
          </button>
        )}
      </Section>
    </div>
  );
}

// Simple Section component
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-[#E65100] mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Job review row component
function JobReviewRow({ name, job, stage, notes, onJobChange, onStageChange, onNotesChange, disabled }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="font-medium text-gray-700 mb-2">{name}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={job}
          onChange={e => onJobChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
          placeholder="Job worked on"
        />
        <input
          type="text"
          value={stage}
          onChange={e => onStageChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
          placeholder="Stage left at"
        />
        <input
          type="text"
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E65100] focus:border-[#E65100]"
          placeholder="Notes"
        />
      </div>
    </div>
  );
}

// Simple checkbox component
function Checkbox({ checked, onChange, disabled }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="w-5 h-5 rounded text-[#E65100] focus:ring-[#E65100] cursor-pointer disabled:cursor-not-allowed"
    />
  );
}
