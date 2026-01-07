import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { documentsApi, templatesApi } from '../api';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = id === 'new';
  const templateId = searchParams.get('template');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [documentData, setDocumentData] = useState(null);

  const formRef = useRef(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Load template if specified
        if (templateId) {
          const { data } = await templatesApi.getById(templateId);
          setSelectedTemplate(data);
        }

        // Load existing document if editing
        if (!isNew) {
          const { data } = await documentsApi.getById(id);
          setDocumentData(data);
          setFormData(data.formData || {});
          // If document has a template, load it
          if (data.templateId) {
            const { data: tpl } = await templatesApi.getById(data.templateId);
            setSelectedTemplate(tpl);
          }
        }
      } catch (err) {
        console.error('Failed to load:', err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, templateId, isNew]);

  // Listen for messages from iframe (form data and resize)
  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === 'formData') {
        setFormData(event.data.data);
      }
      if (event.data?.type === 'resize') {
        const iframe = document.getElementById('formFrame');
        if (iframe) {
          iframe.style.height = event.data.height + 'px';
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Convert template HTML to fillable form by replacing {{ variables }} with inputs
  function convertToFillableForm(html) {
    if (!html) return '';

    // Replace {{ variable }} with input fields
    const converted = html.replace(
      /\{\{\s*([^}]+)\s*\}\}/g,
      (match, variable) => {
        const fieldName = variable.trim();
        const currentValue = formData[fieldName] || '';
        // Determine input type based on field name
        const isTextarea = fieldName.includes('notes') || fieldName.includes('description') || fieldName.includes('details');
        const isCheckbox = fieldName.includes('available') || fieldName.includes('required') || fieldName.startsWith('is_');
        const isDate = fieldName.includes('date');
        const isEmail = fieldName.includes('email');
        const isPhone = fieldName.includes('phone') || fieldName.includes('mobile');

        if (isCheckbox) {
          return `<input type="checkbox" data-field="${fieldName}" ${currentValue ? 'checked' : ''} class="form-checkbox h-5 w-5 text-orange-500 rounded" />`;
        }
        if (isTextarea) {
          return `<textarea data-field="${fieldName}" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">${currentValue}</textarea>`;
        }
        if (isDate) {
          return `<input type="date" data-field="${fieldName}" value="${currentValue}" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />`;
        }
        if (isEmail) {
          return `<input type="email" data-field="${fieldName}" value="${currentValue}" placeholder="email@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />`;
        }
        if (isPhone) {
          return `<input type="tel" data-field="${fieldName}" value="${currentValue}" placeholder="0400 000 000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />`;
        }

        // Default text input
        return `<input type="text" data-field="${fieldName}" value="${currentValue}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />`;
      }
    );

    return converted;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // formData is updated via postMessage from iframe

      const payload = {
        templateId: selectedTemplate?.id || templateId,
        templateName: selectedTemplate?.name,
        formData: formData,
        // Extract common fields for document listing
        customerName: formData['job_contact.name'] || formData['contact.name'] || formData['customer_name'] || formData['client_name'] || 'Unnamed',
        customerEmail: formData['job_contact.email'] || formData['contact.email'] || formData['email'] || '',
        customerPhone: formData['job_contact.phone'] || formData['contact.phone'] || formData['phone'] || '',
        siteAddress: formData['job.site_address'] || formData['site_address'] || formData['address'] || '',
        status: 'LEAD',
      };

      if (isNew) {
        const { data } = await documentsApi.create(payload);
        setSuccess(true);
        navigate(`/documents/${data.id}`);
      } else {
        await documentsApi.update(id, payload);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // No template selected - show message
  if (!selectedTemplate && isNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/documents" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Document</h1>
        </div>
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No template selected</h2>
          <p className="text-gray-500 mb-4">Please select a form template to create a new document.</p>
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Go back and select a template
          </Link>
        </div>
      </div>
    );
  }

  const fillableHtml = convertToFillableForm(selectedTemplate?.htmlTemplate || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/documents" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'New Document' : (documentData?.customerName || 'Document')}
            </h1>
            <p className="text-gray-500 text-sm">
              {selectedTemplate?.name || 'Custom Form'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form Content - Rendered from Template */}
      <div
        ref={formRef}
        className="bg-white rounded-xl shadow print:shadow-none overflow-hidden"
      >
        {/* Render the fillable form in isolated container */}
        <iframe
          id="formFrame"
          srcDoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                html, body {
                  font-family: system-ui, -apple-system, sans-serif;
                  padding: 0;
                  margin: 0;
                  min-height: 100%;
                  width: 100%;
                }
                body {
                  padding: 24px;
                }
                /* Force full width on all containers */
                body > *, body > * > *, .container, .wrapper, .content, section, article, main, form, div {
                  max-width: 100% !important;
                  width: 100% !important;
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                }
                input, textarea, select {
                  border: 1px solid #d1d5db;
                  border-radius: 0.5rem;
                  padding: 0.5rem 0.75rem;
                  width: 100%;
                  box-sizing: border-box;
                }
                input:focus, textarea:focus, select:focus {
                  outline: none;
                  border-color: #f97316;
                  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
                }
                ${selectedTemplate?.cssStyles || ''}
              </style>
            </head>
            <body>
              ${fillableHtml}
              <script>
                // Auto-resize iframe to fit content
                function resizeFrame() {
                  const height = document.body.scrollHeight;
                  window.parent.postMessage({ type: 'resize', height: height + 50 }, '*');
                }

                // Resize on load and after images load
                window.addEventListener('load', resizeFrame);
                setTimeout(resizeFrame, 100);
                setTimeout(resizeFrame, 500);

                // Resize on any DOM changes
                new MutationObserver(resizeFrame).observe(document.body, {
                  childList: true,
                  subtree: true,
                  attributes: true
                });

                // Send form data to parent on change
                function sendFormData() {
                  const inputs = document.querySelectorAll('[data-field]');
                  const data = {};
                  inputs.forEach(input => {
                    if (input.type === 'checkbox') {
                      data[input.dataset.field] = input.checked;
                    } else {
                      data[input.dataset.field] = input.value;
                    }
                  });
                  window.parent.postMessage({ type: 'formData', data }, '*');
                }

                document.body.addEventListener('change', sendFormData);
                document.body.addEventListener('input', sendFormData);
              </script>
            </body>
            </html>
          `}
          className="w-full border-0"
          style={{ minHeight: '100vh', width: '100%' }}
          title="Form"
        />
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .template-form, .template-form * { visibility: visible; }
          .template-form { position: absolute; left: 0; top: 0; width: 100%; }
          .template-form input, .template-form textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
