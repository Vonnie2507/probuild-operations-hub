import { useState, useEffect } from 'react';
import { prestartMeetingApi } from '../api';

// Staff lists
const ALL_STAFF = ['Craig', 'Jake', 'Jarred', 'George', 'David', 'Dave', 'Bradley', 'Vonnie'];

// Australian date format
function formatDateAU(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function PreStartMeetingNew() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [meetingId, setMeetingId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    date: formatDateAU(new Date()),
    time: '06:00',
    runBy: 'Craig (Operations)',
    staffPresent: '',
    // Installer 1
    installer1_name: '',
    installer1_job: '',
    installer1_stage: '',
    installer1_notes: '',
    // Installer 2
    installer2_name: '',
    installer2_job: '',
    installer2_stage: '',
    installer2_notes: '',
    // Challenge & Learning
    challenge: '',
    resolution: '',
    // Win
    win: '',
    // Compliance checks - Installer 1
    i1_clockedOnOff: false,
    i1_checkedIn: false,
    i1_checkedOut: false,
    i1_progressPhotos: false,
    i1_tasksTicked: false,
    i1_stockCheck: false,
    i1_vehicleCleaned: false,
    // Compliance checks - Installer 2
    i2_clockedOnOff: false,
    i2_checkedIn: false,
    i2_checkedOut: false,
    i2_progressPhotos: false,
    i2_tasksTicked: false,
    i2_stockCheck: false,
    i2_vehicleCleaned: false,
    // Tool missing
    toolMissing: false,
    toolMissingWhy: '',
    // Emergency stock
    emergencyStock: false,
    emergencyStockWhat: '',
    // Non-compliance notes
    nonComplianceNotes: '',
    // Safety talk
    safetyPPE: '',
    safetyTopic: '',
    safetyNotes: '',
    // Today's jobs - Installer 1
    i1_job1_address: '',
    i1_job1_scope: '',
    i1_inventoryCheck: false,
    i1_craigVerified: false,
    i1_materialsLoaded: false,
    i1_specialNotes: '',
    // Today's jobs - Installer 2
    i2_job1_address: '',
    i2_job1_scope: '',
    i2_job2_address: '',
    i2_job2_scope: '',
    i2_inventoryCheck: false,
    i2_craigVerified: false,
    i2_materialsLoaded: false,
    i2_specialNotes: '',
    // Meeting close
    understandJobs: false,
    haveToolsMaterials: false,
    questionsAddressed: false,
    endTime: '',
  });

  useEffect(() => {
    loadTodaysMeeting();
  }, []);

  async function loadTodaysMeeting() {
    try {
      const { data } = await prestartMeetingApi.getToday();
      if (data.exists && data.meeting) {
        setMeetingId(data.meeting.id);
        setIsCompleted(data.meeting.status === 'completed');
        setStartTime(data.meeting.startTime);
        if (data.meeting.formData) {
          setFormData(prev => ({ ...prev, ...data.meeting.formData }));
        }
      } else {
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

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      if (meetingId) {
        await prestartMeetingApi.update(meetingId, { formData, status: 'draft' });
      } else {
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
      setMessage('Please confirm all close meeting checks.');
      return;
    }
    setSaving(true);
    const closeTime = new Date();
    const updatedFormData = { ...formData, endTime: closeTime.toTimeString().slice(0, 5) };

    try {
      if (meetingId) {
        await prestartMeetingApi.update(meetingId, {
          formData: updatedFormData,
          status: 'completed',
          endTime: closeTime.toISOString()
        });
      } else {
        await prestartMeetingApi.create({
          runById: formData.runBy,
          attendeeIds: [],
          formData: updatedFormData,
          startTime,
          status: 'completed',
          endTime: closeTime.toISOString()
        });
      }
      setFormData(updatedFormData);
      setIsCompleted(true);
      setMessage('Meeting closed! Have a safe and productive day!');
    } catch (error) {
      console.error('Failed to close:', error);
      setMessage('Error closing meeting.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#E65100] flex items-center justify-center gap-2">
            <span className="text-3xl">🟠</span> 6AM PRE-START MEETING
          </h1>
          <p className="text-gray-600 mt-1">Installation Team Daily Briefing</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-3 rounded text-center ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Date/Time/Run By */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="text" value={formData.date} disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="text" value={formData.time} onChange={e => updateField('time', e.target.value)} disabled={isCompleted} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Run By</label>
            <input type="text" value={formData.runBy} onChange={e => updateField('runBy', e.target.value)} disabled={isCompleted} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Present</label>
            <input type="text" value={formData.staffPresent} onChange={e => updateField('staffPresent', e.target.value)} disabled={isCompleted} placeholder="e.g. Craig, John, Mike" className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
        </div>

        {/* Section 1: Yesterday's Jobs Review */}
        <SectionHeader number="1" title="Yesterday's Jobs Review" />
        <p className="text-sm text-gray-500 italic mb-4">Quick check-in with each team member about their job from yesterday</p>

        <InstallerCard title="Installer 1" formData={formData} updateField={updateField} prefix="installer1" disabled={isCompleted} />
        <InstallerCard title="Installer 2" formData={formData} updateField={updateField} prefix="installer2" disabled={isCompleted} />

        {/* Section 2: Challenge & Learning */}
        <SectionHeader number="2" title="Challenge & Learning" />
        <p className="text-sm text-gray-500 italic mb-4">What was a challenge from yesterday? How did we fix it or what would we do differently?</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
          <textarea value={formData.challenge} onChange={e => updateField('challenge', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Resolution / What we learned</label>
          <textarea value={formData.resolution} onChange={e => updateField('resolution', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        {/* Section 3: Yesterday's Win */}
        <SectionHeader number="3" title="Yesterday's Win" />
        <p className="text-sm text-gray-500 italic mb-4">What went well? Celebrate the positive!</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Win / Great work</label>
          <textarea value={formData.win} onChange={e => updateField('win', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        {/* Section 4: Procedure Compliance Check */}
        <SectionHeader number="4" title="Procedure Compliance Check" />
        <p className="text-sm text-gray-500 italic mb-4">Did each team member follow all required procedures yesterday?</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#E65100] text-white">
                <th className="text-left py-2 px-3 font-medium">Procedure</th>
                <th className="text-center py-2 px-3 font-medium">Installer 1</th>
                <th className="text-center py-2 px-3 font-medium">Installer 2</th>
              </tr>
            </thead>
            <tbody>
              <ComplianceRow label="Clocked on AND off correctly" field1="i1_clockedOnOff" field2="i2_clockedOnOff" formData={formData} updateField={updateField} disabled={isCompleted} />
              <ComplianceRow label="Checked into job on arrival" field1="i1_checkedIn" field2="i2_checkedIn" formData={formData} updateField={updateField} disabled={isCompleted} />
              <ComplianceRow label="Checked out of job on departure" field1="i1_checkedOut" field2="i2_checkedOut" formData={formData} updateField={updateField} disabled={isCompleted} />
              <ComplianceRow label="Updated job card with progress photos" field1="i1_progressPhotos" field2="i2_progressPhotos" formData={formData} updateField={updateField} disabled={isCompleted} />
              <ComplianceRow label="Ticked off completed tasks on job card" field1="i1_tasksTicked" field2="i2_tasksTicked" formData={formData} updateField={updateField} disabled={isCompleted} />
              <ComplianceRow label="Checked job & stock on return (afternoon)" field1="i1_stockCheck" field2="i2_stockCheck" formData={formData} updateField={updateField} disabled={isCompleted} />
              <ComplianceRow label="Cleaned vehicle yesterday" field1="i1_vehicleCleaned" field2="i2_vehicleCleaned" formData={formData} updateField={updateField} disabled={isCompleted} />
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.toolMissing} onChange={e => updateField('toolMissing', e.target.checked)} disabled={isCompleted} className="rounded" />
            <span className="font-medium">If a tool was missing:</span> Was it on your checklist?
          </label>
          <div className="mt-2">
            <label className="block text-sm text-gray-600 mb-1">Why wasn't it packed?</label>
            <textarea value={formData.toolMissingWhy} onChange={e => updateField('toolMissingWhy', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Stock Usage</label>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={formData.emergencyStock} onChange={e => updateField('emergencyStock', e.target.checked)} disabled={isCompleted} className="rounded" />
            Did you use any emergency stock yesterday? (caps, posts, etc.)
          </label>
          <label className="block text-sm text-gray-600 mb-1">If yes, what was used and why?</label>
          <textarea value={formData.emergencyStockWhat} onChange={e => updateField('emergencyStockWhat', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Notes on non-compliance (address directly with staff)</label>
          <textarea value={formData.nonComplianceNotes} onChange={e => updateField('nonComplianceNotes', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-3 mb-6 text-sm text-green-800">
          ✓ If all procedures followed: <strong>ACKNOWLEDGE & PRAISE</strong> - "Great work staying on top of procedures!"
        </div>

        {/* Section 5: Daily Safety Talk */}
        <SectionHeader number="5" title="Daily Safety Talk (2-3 Minutes)" />

        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">A. PPE Check for Today's Tasks</h4>
          <p className="text-sm text-gray-600 mb-2">Today's tasks requiring specific PPE</p>
          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600 mb-3">
            <p>Ask each team member:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>"You're grinding today - do you have your apron and safety glasses?"</li>
              <li>"You're using the saw - do you have ear protection?"</li>
              <li>"Working at height today - is your harness checked?"</li>
            </ul>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">B. Safety Topic / Procedure Review</h4>
          <p className="text-sm text-gray-500 italic mb-2">Choose ONE topic to discuss today (rotate through these weekly):</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {['First Aid Reporting', 'Electrical Safety', 'Manual Handling', 'Working at Heights', 'Working in Heat', 'Site Hazard Awareness', 'Tool Safety', 'Vehicle/Trailer Safety', 'Customer Property Care'].map(topic => (
              <label key={topic} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.safetyTopic === topic} onChange={() => updateField('safetyTopic', topic)} disabled={isCompleted} className="rounded" />
                {topic}
              </label>
            ))}
          </div>
          <label className="block text-sm text-gray-600 mb-1">Today's safety discussion notes</label>
          <textarea value={formData.safetyNotes} onChange={e => updateField('safetyNotes', e.target.value)} disabled={isCompleted} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        {/* Section 6: Today's Jobs Briefing */}
        <SectionHeader number="6" title="Today's Jobs Briefing" />
        <p className="text-sm text-gray-500 italic mb-4">Craig to go through each job in detail. Staff should have completed quality check & inventory count yesterday afternoon.</p>

        <TodaysJobCard title="Installer 1: Today's Jobs" formData={formData} updateField={updateField} prefix="i1" disabled={isCompleted} />
        <TodaysJobCard title="Installer 2: Today's Jobs" formData={formData} updateField={updateField} prefix="i2" showJob2 disabled={isCompleted} />

        {/* Section 7: Meeting Close */}
        <SectionHeader number="7" title="Meeting Close" />

        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
          <p className="font-medium text-gray-700 mb-3">Confirm with each team member:</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.understandJobs} onChange={e => updateField('understandJobs', e.target.checked)} disabled={isCompleted} className="rounded" />
              Do you understand your jobs for today?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.haveToolsMaterials} onChange={e => updateField('haveToolsMaterials', e.target.checked)} disabled={isCompleted} className="rounded" />
              Do you have all your tools and materials?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.questionsAddressed} onChange={e => updateField('questionsAddressed', e.target.checked)} disabled={isCompleted} className="rounded" />
              Any questions or concerns before we head out?
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting End Time</label>
            <input type="text" value={formData.endTime} onChange={e => updateField('endTime', e.target.value)} disabled={isCompleted} placeholder="--:-- --" className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
        </div>

        {/* Buttons */}
        {!isCompleted ? (
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={handleCloseMeeting} disabled={saving} className="flex-1 py-3 bg-[#E65100] text-white rounded font-medium hover:bg-[#BF4400] disabled:opacity-50">
              {saving ? 'Closing...' : 'Close Meeting'}
            </button>
          </div>
        ) : (
          <button onClick={() => setIsCompleted(false)} className="w-full py-3 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300">
            Edit Meeting
          </button>
        )}

        {/* Footer */}
        <p className="text-center text-[#E65100] font-medium mt-6">— Have a safe and productive day! —</p>
      </div>
    </div>
  );
}

function SectionHeader({ number, title }) {
  return (
    <h2 className="text-lg font-semibold text-[#E65100] border-b-2 border-[#E65100] pb-1 mb-3 mt-8">
      {number}. {title}
    </h2>
  );
}

function InstallerCard({ title, formData, updateField, prefix, disabled }) {
  return (
    <div className="border-l-4 border-[#E65100] bg-white pl-4 py-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" value={formData[`${prefix}_name`]} onChange={e => updateField(`${prefix}_name`, e.target.value)} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job from yesterday</label>
          <input type="text" value={formData[`${prefix}_job`]} onChange={e => updateField(`${prefix}_job`, e.target.value)} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage they're up to</label>
          <input type="text" value={formData[`${prefix}_stage`]} onChange={e => updateField(`${prefix}_stage`, e.target.value)} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anything we should know</label>
          <textarea value={formData[`${prefix}_notes`]} onChange={e => updateField(`${prefix}_notes`, e.target.value)} disabled={disabled} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}

function ComplianceRow({ label, field1, field2, formData, updateField, disabled }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2 px-3 text-gray-700">{label}</td>
      <td className="text-center py-2 px-3">
        <input type="checkbox" checked={formData[field1]} onChange={e => updateField(field1, e.target.checked)} disabled={disabled} className="rounded" />
        <span className="ml-1 text-xs text-gray-500">Yes</span>
      </td>
      <td className="text-center py-2 px-3">
        <input type="checkbox" checked={formData[field2]} onChange={e => updateField(field2, e.target.checked)} disabled={disabled} className="rounded" />
        <span className="ml-1 text-xs text-gray-500">Yes</span>
      </td>
    </tr>
  );
}

function TodaysJobCard({ title, formData, updateField, prefix, showJob2 = false, disabled }) {
  return (
    <div className="border-l-4 border-[#E65100] bg-white pl-4 py-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>

      <div className="mb-4">
        <p className="font-medium text-gray-700 mb-2">Job 1</p>
        <div className="space-y-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Address</label>
            <input type="text" value={formData[`${prefix}_job1_address`]} onChange={e => updateField(`${prefix}_job1_address`, e.target.value)} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Scope of work today</label>
            <textarea value={formData[`${prefix}_job1_scope`]} onChange={e => updateField(`${prefix}_job1_scope`, e.target.value)} disabled={disabled} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
        </div>
      </div>

      {showJob2 && (
        <div className="mb-4">
          <p className="font-medium text-gray-700 mb-2">Job 2 (if applicable)</p>
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              <input type="text" value={formData[`${prefix}_job2_address`]} onChange={e => updateField(`${prefix}_job2_address`, e.target.value)} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Scope of work</label>
              <textarea value={formData[`${prefix}_job2_scope`]} onChange={e => updateField(`${prefix}_job2_scope`, e.target.value)} disabled={disabled} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="font-medium text-gray-700 mb-2">Inventory Check</p>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData[`${prefix}_inventoryCheck`]} onChange={e => updateField(`${prefix}_inventoryCheck`, e.target.checked)} disabled={disabled} className="rounded" />
            Installer counted stock yesterday
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData[`${prefix}_craigVerified`]} onChange={e => updateField(`${prefix}_craigVerified`, e.target.checked)} disabled={disabled} className="rounded" />
            Craig verified correct quantities
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData[`${prefix}_materialsLoaded`]} onChange={e => updateField(`${prefix}_materialsLoaded`, e.target.checked)} disabled={disabled} className="rounded" />
            All materials loaded & confirmed
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Special notes/considerations</label>
        <textarea value={formData[`${prefix}_specialNotes`]} onChange={e => updateField(`${prefix}_specialNotes`, e.target.value)} disabled={disabled} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
      </div>
    </div>
  );
}
