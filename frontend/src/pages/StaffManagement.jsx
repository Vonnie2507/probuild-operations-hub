import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  X,
  Edit2,
  UserCheck,
  UserX,
  HardHat,
  Wrench,
  Briefcase,
  Shield
} from 'lucide-react';
import { prestartMeetingApi } from '../api';

const roleIcons = {
  field_installer: HardHat,
  workshop: Wrench,
  operations: Briefcase,
  admin: Shield
};

const roleLabels = {
  field_installer: 'Field Installer',
  workshop: 'Workshop',
  operations: 'Operations',
  admin: 'Admin'
};

const roleColors = {
  field_installer: 'bg-blue-100 text-blue-700',
  workshop: 'bg-purple-100 text-purple-700',
  operations: 'bg-orange-100 text-orange-700',
  admin: 'bg-gray-100 text-gray-700'
};

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'field_installer'
  });
  const [saving, setSaving] = useState(false);

  async function loadStaff() {
    try {
      const { data } = await prestartMeetingApi.getStaff(!showInactive);
      setStaff(data.staff);
    } catch (error) {
      console.error('Failed to load staff:', error);
      setMessage({ type: 'error', text: 'Failed to load staff list.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, [showInactive]);

  function openAddModal() {
    setEditingStaff(null);
    setFormData({ name: '', role: 'field_installer' });
    setShowModal(true);
  }

  function openEditModal(staffMember) {
    setEditingStaff(staffMember);
    setFormData({ name: staffMember.name, role: staffMember.role });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({ name: '', role: 'field_installer' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }

    setSaving(true);
    try {
      if (editingStaff) {
        await prestartMeetingApi.updateStaff(editingStaff.id, formData);
        setMessage({ type: 'success', text: 'Staff member updated.' });
      } else {
        await prestartMeetingApi.createStaff(formData);
        setMessage({ type: 'success', text: 'Staff member added.' });
      }
      closeModal();
      loadStaff();
    } catch (error) {
      console.error('Failed to save staff:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(staffMember) {
    try {
      await prestartMeetingApi.updateStaff(staffMember.id, {
        isActive: !staffMember.isActive
      });
      setMessage({
        type: 'success',
        text: staffMember.isActive ? 'Staff member deactivated.' : 'Staff member reactivated.'
      });
      loadStaff();
    } catch (error) {
      console.error('Failed to update staff:', error);
      setMessage({ type: 'error', text: 'Failed to update staff status.' });
    }
  }

  // Group staff by role
  const groupedStaff = staff.reduce((acc, s) => {
    if (!acc[s.role]) acc[s.role] = [];
    acc[s.role].push(s);
    return acc;
  }, {});

  if (loading) {
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
            <Users className="w-7 h-7 text-orange-500" />
            Staff Management
          </h1>
          <p className="text-gray-500 mt-1">{staff.length} staff members</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            Show inactive
          </label>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Staff List by Role */}
      <div className="space-y-6">
        {['field_installer', 'workshop', 'operations', 'admin'].map(role => {
          const roleStaff = groupedStaff[role] || [];
          if (roleStaff.length === 0) return null;

          const RoleIcon = roleIcons[role];

          return (
            <div key={role} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                <RoleIcon className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">{roleLabels[role]}</h2>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-sm">
                  {roleStaff.length}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {roleStaff.map(s => (
                  <div
                    key={s.id}
                    className={`px-6 py-4 flex items-center justify-between ${
                      !s.isActive ? 'bg-gray-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColors[s.role]}`}
                      >
                        <span className="text-lg font-bold">{s.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[s.role]}`}>
                            {roleLabels[s.role]}
                          </span>
                          {!s.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(s)}
                        className={`p-2 rounded-lg transition-colors ${
                          s.isActive
                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                        }`}
                        title={s.isActive ? 'Deactivate' : 'Reactivate'}
                      >
                        {s.isActive ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {staff.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No staff members found.</p>
          <button
            onClick={openAddModal}
            className="text-orange-500 hover:underline mt-2"
          >
            Add your first staff member
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="field_installer">Field Installer</option>
                  <option value="workshop">Workshop</option>
                  <option value="operations">Operations</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingStaff ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
