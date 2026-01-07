import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ClipboardList, Users, TrendingUp, Plus, X, Code } from 'lucide-react';
import { documentsApi, prestartApi, templatesApi } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documents: 0,
    leads: 0,
    inProgress: 0,
    completed: 0,
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  async function openTemplateModal() {
    setShowTemplateModal(true);
    setTemplatesLoading(true);
    try {
      const { data } = await templatesApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }

  function selectTemplate(templateId) {
    setShowTemplateModal(false);
    if (templateId) {
      navigate(`/documents/new?template=${templateId}`);
    } else {
      navigate('/documents/new');
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await documentsApi.getAll({ limit: 5 });
        setRecentDocs(data.documents);

        // Calculate stats
        const allDocs = data.documents;
        setStats({
          documents: data.pagination.total,
          leads: allDocs.filter(d => d.status === 'LEAD').length,
          inProgress: allDocs.filter(d => d.status === 'IN_PROGRESS').length,
          completed: allDocs.filter(d => d.status === 'COMPLETED').length,
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusColors = {
    LEAD: 'bg-blue-100 text-blue-800',
    QUOTED: 'bg-purple-100 text-purple-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    SCHEDULED: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ON_HOLD: 'bg-gray-100 text-gray-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={openTemplateModal}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
          <Link
            to="/prestart/new"
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Start Pre-Start
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              <p className="text-sm text-gray-500">Total Documents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.leads}</p>
              <p className="text-sm text-gray-500">Active Leads</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentDocs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No documents yet.{' '}
              <button onClick={openTemplateModal} className="text-orange-500 hover:underline">
                Create your first document
              </button>
            </div>
          ) : (
            recentDocs.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{doc.customerName}</p>
                  <p className="text-sm text-gray-500">{doc.siteAddress || 'No address'}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColors[doc.status]
                  }`}
                >
                  {doc.status.replace('_', ' ')}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Choose a Template</h2>
                <p className="text-sm text-gray-500">Select a form template or start blank</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {templatesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => selectTemplate(null)}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="bg-gray-100 group-hover:bg-orange-100 p-3 rounded-lg w-fit mb-3">
                      <FileText className="w-6 h-6 text-gray-500 group-hover:text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Blank Document</h3>
                    <p className="text-sm text-gray-500 mt-1">Start from scratch</p>
                  </button>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.id)}
                      className="p-6 border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
                    >
                      <div className="bg-orange-100 p-3 rounded-lg w-fit mb-3">
                        <Code className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {template.description || 'Custom template'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {!templatesLoading && templates.length === 0 && (
                <p className="text-center text-gray-500 mt-4">
                  No templates yet.{' '}
                  <Link to="/templates" className="text-orange-500 hover:underline">
                    Create your first template
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
