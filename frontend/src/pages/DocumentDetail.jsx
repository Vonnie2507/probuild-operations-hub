import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  Plus,
  CheckCircle,
  AlertCircle,
  Dog,
  Car,
  Zap,
  Droplets,
  FileText,
  Search,
  User,
  Code,
} from 'lucide-react';
import { documentsApi, jobmanApi, templatesApi } from '../api';
import { format } from 'date-fns';

const statusOptions = [
  { value: 'LEAD', label: 'Lead', color: 'blue' },
  { value: 'QUOTED', label: 'Quoted', color: 'purple' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'green' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'yellow' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'orange' },
  { value: 'COMPLETED', label: 'Completed', color: 'gray' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'gray' },
];

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = id === 'new';
  const templateId = searchParams.get('template');

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [renderedTemplate, setRenderedTemplate] = useState('');

  const [document, setDocument] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerMobile: '',
    siteAddress: '',
    siteAddressLine1: '',
    siteAddressLine2: '',
    siteCity: '',
    siteState: 'QLD',
    sitePostcode: '',
    status: 'LEAD',
    siteAccess: '',
    parkingDetails: '',
    gateCode: '',
    keyLocation: '',
    groundConditions: '',
    slopeDetails: '',
    undergroundServices: '',
    dbydReference: '',
    existingFence: '',
    removalRequired: false,
    removalNotes: '',
    powerAvailable: false,
    waterAvailable: false,
    toiletAvailable: false,
    dogOnProperty: false,
    dogDetails: '',
    neighbourContact: '',
    councilApproval: false,
    councilReference: '',
    specialRequirements: '',
    preferredDays: [],
    preferredTimes: '',
    accessRestrictions: '',
    installNotes: '',
    productionNotes: '',
  });

  // Contact search state
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [allContacts, setAllContacts] = useState([]); // Cache all contacts
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [sameAsContactAddress, setSameAsContactAddress] = useState(true);
  const [contactAddress, setContactAddress] = useState(null); // Store contact's address
  const contactSearchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      fetchDocument();
    }
    // Load template if specified
    if (templateId) {
      loadTemplate(templateId);
    }
    // Preload contacts for fast search
    loadAllContacts();
  }, [id, templateId]);

  async function loadTemplate(tplId) {
    try {
      const { data } = await templatesApi.getById(tplId);
      setSelectedTemplate(data);
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  }

  async function renderTemplatePreview() {
    if (!selectedTemplate) return;
    try {
      // Build context from current document data
      const context = {
        job: {
          number: document.jobNumber || 'J-0000',
          site_address: document.siteAddress || '',
        },
        job_contact: {
          name: document.customerName || '',
          email: document.customerEmail || '',
          phone: document.customerPhone || '',
          mobile: document.customerMobile || '',
        },
        date: {
          current: format(new Date(), 'dd/MM/yyyy'),
          year: new Date().getFullYear().toString(),
        },
      };

      const { data } = await templatesApi.preview(selectedTemplate.id, context);
      setRenderedTemplate(data.renderedHtml);
      setShowTemplatePreview(true);
    } catch (err) {
      console.error('Failed to render template:', err);
      alert('Failed to render template preview');
    }
  }

  // Preload all contacts on mount for instant search
  async function loadAllContacts() {
    try {
      const { data } = await jobmanApi.getContacts({ per_page: 500 });
      const contacts = data?.contacts?.data || data?.data || data || [];
      setAllContacts(contacts);
      setContactsLoaded(true);
    } catch (err) {
      console.error('Failed to preload contacts:', err);
    }
  }

  // Filter contacts locally for instant results
  useEffect(() => {
    if (contactSearch.length < 2) {
      setContactResults([]);
      setShowContactDropdown(false);
      return;
    }

    const searchLower = contactSearch.toLowerCase();

    if (contactsLoaded && allContacts.length > 0) {
      // Instant local filter
      const filtered = allContacts.filter(contact => {
        const name = (contact.name || contact.primary_contact_person_name || '').toLowerCase();
        const email = (contact.email || contact.primary_contact_person_email || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      }).slice(0, 10); // Limit to 10 results

      setContactResults(filtered);
      setShowContactDropdown(true);
    } else {
      // Fallback to API search if contacts not loaded yet
      setSearchingContacts(true);
      const searchContacts = async () => {
        try {
          const { data } = await jobmanApi.getContacts({ search: contactSearch });
          const contacts = data?.contacts?.data || data?.data || data || [];
          setContactResults(contacts);
          setShowContactDropdown(true);
        } catch (err) {
          console.error('Failed to search contacts:', err);
          setContactResults([]);
        } finally {
          setSearchingContacts(false);
        }
      };

      const debounce = setTimeout(searchContacts, 150);
      return () => clearTimeout(debounce);
    }
  }, [contactSearch, contactsLoaded, allContacts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        contactSearchRef.current &&
        !contactSearchRef.current.contains(event.target)
      ) {
        setShowContactDropdown(false);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectContact(contact) {
    // Get address from contact (prefer street address, fall back to postal)
    const address = {
      full: contact.street_address || contact.postal_address || '',
      line1: contact.street_address_line1 || contact.postal_address_line1 || '',
      line2: contact.street_address_line2 || contact.postal_address_line2 || '',
      city: contact.street_address_city || contact.postal_address_city || '',
      state: contact.street_address_region || contact.postal_address_region || '',
      postcode: contact.street_address_postal_code || contact.postal_address_postal_code || '',
    };

    // Store contact address for toggle
    setContactAddress(address);
    setSameAsContactAddress(true);

    setDocument((prev) => ({
      ...prev,
      customerName: contact.name || contact.primary_contact_person_name || '',
      customerEmail: contact.email || contact.primary_contact_person_email || '',
      customerPhone: contact.phone || '',
      customerMobile: contact.mobile || contact.primary_contact_person_mobile || '',
      // Auto-fill site address from contact
      siteAddress: address.full,
      siteAddressLine1: address.line1,
      siteAddressLine2: address.line2,
      siteCity: address.city,
      siteState: address.state || 'WA',
      sitePostcode: address.postcode,
    }));
    setContactSearch('');
    setShowContactDropdown(false);
    setSuccess(false);
  }

  function handleSameAddressToggle(checked) {
    setSameAsContactAddress(checked);
    if (checked && contactAddress) {
      // Copy contact address to site address
      setDocument((prev) => ({
        ...prev,
        siteAddress: contactAddress.full,
        siteAddressLine1: contactAddress.line1,
        siteAddressLine2: contactAddress.line2,
        siteCity: contactAddress.city,
        siteState: contactAddress.state || 'WA',
        sitePostcode: contactAddress.postcode,
      }));
    } else if (!checked) {
      // Clear site address for manual entry
      setDocument((prev) => ({
        ...prev,
        siteAddress: '',
        siteAddressLine1: '',
        siteAddressLine2: '',
        siteCity: '',
        siteState: 'WA',
        sitePostcode: '',
      }));
    }
  }

  async function fetchDocument() {
    try {
      const { data } = await documentsApi.getById(id);
      setDocument(data);
    } catch (err) {
      setError('Failed to load document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setDocument((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  function handleDayToggle(day) {
    const days = document.preferredDays || [];
    if (days.includes(day)) {
      handleChange('preferredDays', days.filter((d) => d !== day));
    } else {
      handleChange('preferredDays', [...days, day]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const { data } = await documentsApi.create(document);
        navigate(`/documents/${data.id}`);
      } else {
        await documentsApi.update(id, document);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (isNew) {
      handleChange('status', newStatus);
      return;
    }
    try {
      await documentsApi.updateStatus(id, newStatus);
      setDocument((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError('Failed to update status');
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
        <div className="flex items-center gap-4">
          <Link
            to="/documents"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'New Document' : document.customerName}
            </h1>
            {!isNew && (
              <p className="text-gray-500 text-sm">
                Created {format(new Date(document.createdAt), 'dd MMM yyyy')}
              </p>
            )}
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
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Template Info Bar */}
      {selectedTemplate && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Code className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Using Template: {selectedTemplate.name}</p>
                <p className="text-sm text-gray-500">{selectedTemplate.description || selectedTemplate.type.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={renderTemplatePreview}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Preview Form
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 mr-2">Status:</span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                document.status === opt.value
                  ? `bg-${opt.color}-500 text-white`
                  : `bg-gray-100 text-gray-600 hover:bg-gray-200`
              }`}
              style={
                document.status === opt.value
                  ? {
                      backgroundColor:
                        opt.color === 'blue' ? '#3b82f6' :
                        opt.color === 'purple' ? '#8b5cf6' :
                        opt.color === 'green' ? '#22c55e' :
                        opt.color === 'yellow' ? '#eab308' :
                        opt.color === 'orange' ? '#f97316' :
                        opt.color === 'red' ? '#ef4444' : '#6b7280',
                      color: 'white',
                    }
                  : {}
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>

          {/* Contact Search */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-1" /> Search Jobman Contacts
            </label>
            <input
              ref={contactSearchRef}
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder={contactsLoaded ? `Search ${allContacts.length} contacts...` : "Loading contacts..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {searchingContacts && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              </div>
            )}
            {showContactDropdown && contactResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                {contactResults.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => selectContact(contact)}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {contact.name || contact.primary_contact_person_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(contact.email || contact.primary_contact_person_email) && (
                            <span>{contact.email || contact.primary_contact_person_email}</span>
                          )}
                          {(contact.email || contact.primary_contact_person_email) && contact.mobile && <span> • </span>}
                          {contact.mobile && <span>{contact.mobile}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showContactDropdown && contactSearch.length >= 2 && contactResults.length === 0 && !searchingContacts && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                No contacts found
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={document.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={document.customerEmail || ''}
                onChange={(e) => handleChange('customerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={document.customerPhone || ''}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                value={document.customerMobile || ''}
                onChange={(e) => handleChange('customerMobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Site Address */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Site Address</h2>
            {contactAddress && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsContactAddress}
                  onChange={(e) => handleSameAddressToggle(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">Same as contact address</span>
              </label>
            )}
          </div>

          {/* Show contact address summary when checked */}
          {sameAsContactAddress && contactAddress && contactAddress.full && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Using contact address:</span> {contactAddress.full || `${contactAddress.line1}, ${contactAddress.city} ${contactAddress.state} ${contactAddress.postcode}`}
              </p>
            </div>
          )}

          {/* Show address fields when unchecked or no contact selected */}
          {(!sameAsContactAddress || !contactAddress) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  value={document.siteAddress || ''}
                  onChange={(e) => handleChange('siteAddress', e.target.value)}
                  placeholder="123 Main St, Perth WA 6000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={document.siteAddressLine1 || ''}
                  onChange={(e) => handleChange('siteAddressLine1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={document.siteAddressLine2 || ''}
                  onChange={(e) => handleChange('siteAddressLine2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={document.siteCity || ''}
                  onChange={(e) => handleChange('siteCity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={document.siteState || 'WA'}
                    onChange={(e) => handleChange('siteState', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="WA">WA</option>
                    <option value="QLD">QLD</option>
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="NT">NT</option>
                    <option value="ACT">ACT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={document.sitePostcode || ''}
                    onChange={(e) => handleChange('sitePostcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Site Access */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Details
              </label>
              <textarea
                value={document.siteAccess || ''}
                onChange={(e) => handleChange('siteAccess', e.target.value)}
                placeholder="How do installers access the site? Any gates, codes, keys needed?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Car className="w-4 h-4 inline mr-1" /> Parking Details
              </label>
              <textarea
                value={document.parkingDetails || ''}
                onChange={(e) => handleChange('parkingDetails', e.target.value)}
                placeholder="Where can the truck/ute park?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gate Code
              </label>
              <input
                type="text"
                value={document.gateCode || ''}
                onChange={(e) => handleChange('gateCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Location
              </label>
              <input
                type="text"
                value={document.keyLocation || ''}
                onChange={(e) => handleChange('keyLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Restrictions
              </label>
              <textarea
                value={document.accessRestrictions || ''}
                onChange={(e) => handleChange('accessRestrictions', e.target.value)}
                placeholder="Any time or access restrictions?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Ground & Site Conditions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ground & Site Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ground Conditions
              </label>
              <textarea
                value={document.groundConditions || ''}
                onChange={(e) => handleChange('groundConditions', e.target.value)}
                placeholder="Rocky, sandy, clay, etc."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slope Details
              </label>
              <textarea
                value={document.slopeDetails || ''}
                onChange={(e) => handleChange('slopeDetails', e.target.value)}
                placeholder="Any slopes or level changes?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Underground Services
              </label>
              <textarea
                value={document.undergroundServices || ''}
                onChange={(e) => handleChange('undergroundServices', e.target.value)}
                placeholder="Power, water, gas, sewerage, etc."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DBYD Reference
              </label>
              <input
                type="text"
                value={document.dbydReference || ''}
                onChange={(e) => handleChange('dbydReference', e.target.value)}
                placeholder="Dial Before You Dig reference number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Existing Fence */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Fence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Fence Details
              </label>
              <textarea
                value={document.existingFence || ''}
                onChange={(e) => handleChange('existingFence', e.target.value)}
                placeholder="Description of existing fence if any"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="removalRequired"
                checked={document.removalRequired}
                onChange={(e) => handleChange('removalRequired', e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <label htmlFor="removalRequired" className="text-sm font-medium text-gray-700">
                Removal Required
              </label>
            </div>
            {document.removalRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Removal Notes
                </label>
                <textarea
                  value={document.removalNotes || ''}
                  onChange={(e) => handleChange('removalNotes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Utilities & On-Site */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilities & On-Site</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={document.powerAvailable}
                onChange={(e) => handleChange('powerAvailable', e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">Power Available</span>
            </label>
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={document.waterAvailable}
                onChange={(e) => handleChange('waterAvailable', e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <Droplets className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Water Available</span>
            </label>
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={document.toiletAvailable}
                onChange={(e) => handleChange('toiletAvailable', e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-xl">🚻</span>
              <span className="text-sm font-medium">Toilet Available</span>
            </label>
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={document.dogOnProperty}
                onChange={(e) => handleChange('dogOnProperty', e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <Dog className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium">Dog on Property</span>
            </label>
          </div>
          {document.dogOnProperty && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dog Details
              </label>
              <input
                type="text"
                value={document.dogDetails || ''}
                onChange={(e) => handleChange('dogDetails', e.target.value)}
                placeholder="Breed, name, temperament"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          )}
        </div>

        {/* Special Requirements */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Neighbour Contact
              </label>
              <textarea
                value={document.neighbourContact || ''}
                onChange={(e) => handleChange('neighbourContact', e.target.value)}
                placeholder="Any neighbour coordination needed?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id="councilApproval"
                  checked={document.councilApproval}
                  onChange={(e) => handleChange('councilApproval', e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="councilApproval" className="text-sm font-medium text-gray-700">
                  Council Approval Required
                </label>
              </div>
              {document.councilApproval && (
                <input
                  type="text"
                  value={document.councilReference || ''}
                  onChange={(e) => handleChange('councilReference', e.target.value)}
                  placeholder="Council reference number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requirements
              </label>
              <textarea
                value={document.specialRequirements || ''}
                onChange={(e) => handleChange('specialRequirements', e.target.value)}
                placeholder="Any other special requirements or notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Days
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                  (day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (document.preferredDays || []).includes(day)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Times
              </label>
              <input
                type="text"
                value={document.preferredTimes || ''}
                onChange={(e) => handleChange('preferredTimes', e.target.value)}
                placeholder="e.g., Morning only, After 10am"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Installation Notes
              </label>
              <textarea
                value={document.installNotes || ''}
                onChange={(e) => handleChange('installNotes', e.target.value)}
                placeholder="Notes for installation team"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Production Notes
              </label>
              <textarea
                value={document.productionNotes || ''}
                onChange={(e) => handleChange('productionNotes', e.target.value)}
                placeholder="Notes for production team"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            to="/documents"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isNew ? 'Create Document' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Form Preview: {selectedTemplate?.name}</h2>
                <p className="text-sm text-gray-500">Preview with current document data</p>
              </div>
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-100">
              <div className="bg-white shadow-lg mx-auto max-w-3xl">
                <div
                  className="p-8"
                  dangerouslySetInnerHTML={{ __html: renderedTemplate }}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Print Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
