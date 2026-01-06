import { useState, useEffect } from 'react';
import { Plus, FileText, Code, Eye, Save, X, Copy, Trash2, Edit2 } from 'lucide-react';
import { templatesApi } from '../api';

const FORM_TYPES = [
  { value: 'SITE_ASSESSMENT', label: 'Site Assessment' },
  { value: 'RISK_ASSESSMENT', label: 'Risk Assessment' },
  { value: 'PRESTART_CHECKLIST', label: 'Pre-Start Checklist' },
  { value: 'COMPLETION_FORM', label: 'Completion Form' },
  { value: 'SIGNOFF_FORM', label: 'Sign-off Form' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [variables, setVariables] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CUSTOM',
    htmlTemplate: '',
    cssStyles: '',
  });

  useEffect(() => {
    loadTemplates();
    loadVariables();
  }, []);

  async function loadTemplates() {
    try {
      const res = await templatesApi.getAll();
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVariables() {
    try {
      const res = await templatesApi.getVariables();
      setVariables(res.data);
    } catch (error) {
      console.error('Failed to load variables:', error);
    }
  }

  async function handlePreview() {
    try {
      const res = await templatesApi.previewRaw(
        formData.htmlTemplate,
        formData.cssStyles
      );
      setPreviewHtml(res.data.renderedHtml);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Preview failed. Check your HTML syntax.');
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.htmlTemplate) {
      alert('Name and HTML template are required');
      return;
    }

    try {
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, formData);
      } else {
        await templatesApi.create(formData);
      }
      loadTemplates();
      resetForm();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save template');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templatesApi.delete(id);
      loadTemplates();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete template');
    }
  }

  function handleEdit(template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      htmlTemplate: template.htmlTemplate,
      cssStyles: template.cssStyles || '',
    });
    setShowEditor(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      type: 'CUSTOM',
      htmlTemplate: '',
      cssStyles: '',
    });
    setEditingTemplate(null);
    setShowEditor(false);
    setShowPreview(false);
  }

  function copyVariable(variable) {
    const text = `{{ ${variable} }}`;
    navigator.clipboard.writeText(text);
  }

  function insertVariable(variable) {
    const text = `{{ ${variable} }}`;
    setFormData(prev => ({
      ...prev,
      htmlTemplate: prev.htmlTemplate + text
    }));
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Forms & Templates</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create custom forms with HTML - use template variables to auto-fill data
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first form template to get started</p>
          <button
            onClick={() => setShowEditor(true)}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Code className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {template.description || 'No description'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {FORM_TYPES.find(t => t.value === template.type)?.label || template.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {template._count?.submissions || 0} submissions
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  {/* Name & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Site Risk Assessment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {FORM_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What is this template used for?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* HTML Template */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HTML Template *
                    </label>
                    <textarea
                      value={formData.htmlTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, htmlTemplate: e.target.value }))}
                      placeholder={`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>{{ organisation.name }}</h1>
  <p>Job: {{ job.number }}</p>
  <p>Site: {{ job.site_address }}</p>
</body>
</html>`}
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* CSS Styles (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional CSS (Optional)
                    </label>
                    <textarea
                      value={formData.cssStyles}
                      onChange={(e) => setFormData(prev => ({ ...prev, cssStyles: e.target.value }))}
                      placeholder=".custom-class { color: #333; }"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Editor Footer */}
                <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-3">
                  <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    <Save className="w-4 h-4" />
                    Save Template
                  </button>
                </div>
              </div>

              {/* Right: Variables Sidebar */}
              <div className="w-72 border-l bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Template Variables</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Click to copy, or click + to insert into template
                  </p>

                  {Object.entries(variables).map(([category, vars]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {vars.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-1 text-xs"
                          >
                            <button
                              onClick={() => insertVariable(v.id)}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Insert into template"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => copyVariable(v.id)}
                              className="flex-1 text-left px-2 py-1 bg-white border rounded hover:bg-gray-50 font-mono truncate"
                              title={`Example: ${v.example}`}
                            >
                              {'{{ '}{v.id}{' }}'}
                            </button>
                            <button
                              onClick={() => copyVariable(v.id)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-100">
              <div className="bg-white shadow-lg mx-auto max-w-3xl">
                <div
                  className="p-8"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Editor
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Save className="w-4 h-4" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
