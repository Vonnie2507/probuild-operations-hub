import { Settings as SettingsIcon, Link2, Database, Clock, AlertCircle } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-orange-500" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">System configuration and integrations</p>
      </div>

      {/* Jobman Integration Card */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100">
          <Link2 className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">Jobman Integration</h2>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            Coming Soon
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Database className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">
                Field Mapping Configuration
              </h3>
              <p className="text-gray-600 mb-4">
                Connect your Pre-Start Meeting data with Jobman. Map your fields to Jobman API
                endpoints for automatic synchronization of staff, jobs, and compliance data.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Automatic sync with Jobman scheduled jobs
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Map custom fields to Jobman properties
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Link staff records to Jobman staff profiles
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Integration Ready</p>
              <p className="text-sm text-blue-700 mt-1">
                The database has been prepared with field mapping tables. Once the Jobman API
                fields are confirmed, you can configure the mappings here without any code changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Future Settings Placeholder */}
      <div className="bg-white rounded-xl shadow p-6 border-2 border-dashed border-gray-200">
        <div className="text-center text-gray-500">
          <SettingsIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Additional settings will appear here</p>
          <p className="text-sm mt-1">
            Compliance check configuration, notification settings, and more
          </p>
        </div>
      </div>
    </div>
  );
}
