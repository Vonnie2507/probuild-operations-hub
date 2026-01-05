import { useState } from 'react';
import { Plus, FileText, ClipboardList, CheckSquare, Wrench, Edit2, Trash2 } from 'lucide-react';

const defaultTemplates = [
  {
    id: '1',
    name: 'Live Project Document',
    description: 'Complete project document for tracking customer and site details',
    type: 'document',
    icon: FileText,
    isDefault: true,
    sections: [
      'Customer Information',
      'Site Address',
      'Site Access',
      'Ground Conditions',
      'Existing Fence',
      'Utilities',
      'Special Requirements',
      'Scheduling',
      'Notes',
    ],
  },
  {
    id: '2',
    name: 'Pre-Start Meeting',
    description: 'Daily team briefing form with compliance tracking',
    type: 'form',
    icon: ClipboardList,
    isDefault: true,
    sections: [
      'Staff Present',
      "Yesterday's Jobs",
      "Today's Jobs",
      'Challenges',
      'Wins',
      'Safety Topics',
      'Action Items',
    ],
  },
  {
    id: '3',
    name: 'Site Inspection Checklist',
    description: 'Pre-installation site inspection form',
    type: 'checklist',
    icon: CheckSquare,
    isDefault: true,
    sections: [
      'Site Access Verified',
      'Measurements Confirmed',
      'Underground Services Checked',
      'Customer Requirements Reviewed',
      'Photos Taken',
    ],
  },
  {
    id: '4',
    name: 'Installation Report',
    description: 'Daily progress report for installation jobs',
    type: 'form',
    icon: Wrench,
    isDefault: true,
    sections: [
      'Work Completed',
      'Materials Used',
      'Issues Encountered',
      'Tomorrow\'s Plan',
      'Photo Documentation',
    ],
  },
];

export default function Templates() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'form',
    sections: [],
  });
  const [newSection, setNewSection] = useState('');

  function addSection() {
    if (newSection.trim()) {
      setNewTemplate((prev) => ({
        ...prev,
        sections: [...prev.sections, newSection.trim()],
      }));
      setNewSection('');
    }
  }

  function removeSection(index) {
    setNewTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  }

  function createTemplate() {
    if (newTemplate.name.trim()) {
      const template = {
        id: Date.now().toString(),
        ...newTemplate,
        icon: newTemplate.type === 'document' ? FileText :
              newTemplate.type === 'checklist' ? CheckSquare : ClipboardList,
        isDefault: false,
      };
      setTemplates((prev) => [...prev, template]);
      setShowCreateModal(false);
      setNewTemplate({ name: '', description: '', type: 'form', sections: [] });
    }
  }

  function deleteTemplate(id) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms & Templates</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage document templates and forms
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Template Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <FileText className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-blue-900">Documents</h3>
          <p className="text-sm text-blue-700">
            Full project documents with multiple sections and fields
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <ClipboardList className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-green-900">Forms</h3>
          <p className="text-sm text-green-700">
            Data entry forms for daily operations and reporting
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <CheckSquare className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-purple-900">Checklists</h3>
          <p className="text-sm text-purple-700">
            Simple checklists for inspections and tasks
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <template.icon className="w-6 h-6 text-gray-600" />
                </div>
                {!template.isDefault && (
                  <div className="flex items-center gap-1">
                    <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Sections ({template.sections.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 4).map((section, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {section}
                    </span>
                  ))}
                  {template.sections.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                      +{template.sections.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  template.type === 'document'
                    ? 'bg-blue-100 text-blue-700'
                    : template.type === 'checklist'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {template.type}
              </span>
              {template.isDefault && (
                <span className="text-xs text-gray-400">Default</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Site Assessment Form"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What is this template used for?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newTemplate.type}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="form">Form</option>
                  <option value="document">Document</option>
                  <option value="checklist">Checklist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sections
                </label>
                <div className="space-y-2 mb-2">
                  {newTemplate.sections.map((section, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm">{section}</span>
                      <button
                        onClick={() => removeSection(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSection()}
                    placeholder="Add section..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    onClick={addSection}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTemplate({
                      name: '',
                      description: '',
                      type: 'form',
                      sections: [],
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTemplate}
                  disabled={!newTemplate.name.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
