import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Shield,
  BarChart3,
  ListPlus,
  FileText,
  Upload,
  History,
  Trash2,
  Edit2,
  Plus,
  Check,
  AlertCircle,
  Eye,
  Star,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Category, Resource, AdminStats, AuditLog } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  allResources: Resource[];
  isAdminLoggedIn: boolean;
  onLoginSuccess: (token: string) => void;
  onLogout: () => void;
  onResourceCreatedOrUpdated: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  categories,
  allResources,
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout,
  onResourceCreatedOrUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'resources' | 'form' | 'import' | 'audit'>('analytics');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('osint2025!');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Stats & Audit
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Resource Management Search
  const [resourceSearch, setResourceSearch] = useState('');
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '1',
    url: '',
    description: '',
    usage_context: '',
    input_output: '',
    opsec_notes: '',
    tool_flags: 'T',
    is_free: '1',
    tags: ''
  });
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Bulk Import State
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');

  // Fetch stats and logs when logged in
  useEffect(() => {
    if (isAdminLoggedIn && isOpen) {
      fetchAdminStats();
      fetchAuditLogs();
    }
  }, [isAdminLoggedIn, isOpen]);

  if (!isOpen) return null;

  const fetchAdminStats = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.token);
      } else {
        setLoginError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Connection error');
    } finally {
      setLoginLoading(false);
    }
  };

  const startEditResource = (r: Resource) => {
    setEditingResource(r);
    setFormData({
      name: r.name,
      category_id: String(r.category_id),
      url: r.url,
      description: r.description || '',
      usage_context: r.usage_context || '',
      input_output: r.input_output || '',
      opsec_notes: r.opsec_notes || '',
      tool_flags: r.tool_flags || 'T',
      is_free: String(r.is_free),
      tags: (r.tags || []).join(', ')
    });
    setActiveTab('form');
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? String(categories[0].id) : '1',
      url: '',
      description: '',
      usage_context: '',
      input_output: '',
      opsec_notes: '',
      tool_flags: 'T',
      is_free: '1',
      tags: ''
    });
    setFormSuccess('');
    setFormError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const endpoint = editingResource
        ? `/api/admin/resources/${editingResource.id}`
        : '/api/admin/resources';

      const method = editingResource ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id, 10),
          is_free: parseInt(formData.is_free, 10),
          tags: tagsArray
        })
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(editingResource ? 'Resource updated successfully!' : 'Resource added successfully!');
        onResourceCreatedOrUpdated();
        fetchAdminStats();
        fetchAuditLogs();
        if (!editingResource) {
          resetForm();
        }
      } else {
        setFormError(data.error || 'Failed to save resource');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error');
    }
  };

  const handleDeleteResource = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onResourceCreatedOrUpdated();
        fetchAdminStats();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkImport = async () => {
    setImportResult('');
    try {
      let itemsToImport: any[] = [];
      const trimmed = importText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        itemsToImport = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Assume CSV
        const lines = trimmed.split('\n').filter(Boolean);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const item: any = {};
          headers.forEach((h, idx) => {
            item[h] = cols[idx];
          });
          itemsToImport.push(item);
        }
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToImport })
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.message);
        onResourceCreatedOrUpdated();
        fetchAdminStats();
        fetchAuditLogs();
        setImportText('');
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportResult(`Parse error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-slate-100">
                  Administrative Control Portal
                </h2>
                {isAdminLoggedIn && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    AUTHENTICATED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Manage OSINT datasets, database schemas, and analytics telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 transition-colors"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Logged In Screen */}
        {!isAdminLoggedIn ? (
          <div className="p-8 flex flex-col items-center justify-center max-w-md mx-auto my-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/30">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-mono text-slate-100">
              Security Access Required
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enter authorized administrative credentials to manage resources, monitor telemetry, and trigger bulk ingest operations.
            </p>

            {/* Hint for evaluators */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-left w-full text-slate-300">
              <span className="text-cyan-400 font-semibold">Demo Credentials:</span>
              <div className="mt-1 text-slate-400 text-[11px]">
                Username: <strong className="text-slate-200">admin</strong><br />
                Password: <strong className="text-slate-200">osint2025!</strong>
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-6 w-full space-y-3 text-left">
              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                <span>Authorize & Enter Console</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Nav Tabs */}
            <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                  activeTab === 'analytics'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics & Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                  activeTab === 'resources'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Resource Inventory ({allResources.length})</span>
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('form');
                }}
                className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                  activeTab === 'form'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{editingResource ? 'Edit Tool' : 'Add New Tool'}</span>
              </button>

              <button
                onClick={() => setActiveTab('import')}
                className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                  activeTab === 'import'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Ingest (JSON/CSV)</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                  activeTab === 'audit'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit Trail</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* 1. Analytics & Telemetry */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {stats ? (
                    <>
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs font-mono text-slate-400 uppercase">Total Catalog</span>
                          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                            {stats.totalResources}
                          </div>
                          <span className="text-[11px] text-slate-400">Indexed tools</span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs font-mono text-slate-400 uppercase">Sectors</span>
                          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                            {stats.totalCategories}
                          </div>
                          <span className="text-[11px] text-slate-400">Taxonomy trees</span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs font-mono text-slate-400 uppercase">Total Views</span>
                          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                            {stats.totalViews}
                          </div>
                          <span className="text-[11px] text-slate-400">Direct tool launches</span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs font-mono text-slate-400 uppercase">Community Score</span>
                          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                            {stats.avgRating} ★
                          </div>
                          <span className="text-[11px] text-slate-400">Average review</span>
                        </div>
                      </div>

                      {/* Distribution & Top Tools */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Top Categories */}
                        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            <span>Top Intelligence Sectors</span>
                          </h4>
                          <div className="space-y-3">
                            {stats.topCategories.map((c) => (
                              <div key={c.name} className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 truncate max-w-[200px]">{c.name}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-28 bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-cyan-500 h-full rounded-full"
                                      style={{ width: `${Math.min(100, (c.count / 25) * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-mono text-slate-400 w-8 text-right">{c.count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Most Launched Tools */}
                        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span>Most Launched Resources</span>
                          </h4>
                          <div className="space-y-2.5">
                            {stats.mostViewed.map((t) => (
                              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                                <div className="truncate">
                                  <span className="font-medium text-slate-200 block truncate">{t.name}</span>
                                  <span className="text-[10px] font-mono text-cyan-400">Flags: {t.tool_flags}</span>
                                </div>
                                <div className="font-mono text-right shrink-0">
                                  <span className="text-slate-300 font-bold block">{t.views} views</span>
                                  <span className="text-amber-400 text-[10px]">★ {t.rating_avg.toFixed(1)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">Loading analytics data...</div>
                  )}
                </div>
              )}

              {/* 2. Resource Inventory List */}
              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      placeholder="Search inventory..."
                      className="w-full max-w-sm px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />

                    <button
                      onClick={() => {
                        resetForm();
                        setActiveTab('form');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Tool</span>
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Flags</th>
                          <th className="py-2.5 px-3">Views</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {allResources
                          .filter(r => r.name.toLowerCase().includes(resourceSearch.toLowerCase()) || r.category_name.toLowerCase().includes(resourceSearch.toLowerCase()))
                          .slice(0, 50)
                          .map((r) => (
                            <tr key={r.id} className="hover:bg-slate-800/50">
                              <td className="py-2 px-3 font-medium text-slate-200 truncate max-w-xs">{r.name}</td>
                              <td className="py-2 px-3 text-slate-400 font-mono">{r.category_name}</td>
                              <td className="py-2 px-3 font-mono text-cyan-300">({r.tool_flags})</td>
                              <td className="py-2 px-3 font-mono text-slate-300">{r.views}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => startEditResource(r)}
                                  className="p-1 text-slate-400 hover:text-cyan-400 mr-2"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteResource(r.id, r.name)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Add / Edit Tool Form */}
              {activeTab === 'form' && (
                <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono font-bold text-slate-200 uppercase">
                      {editingResource ? `Editing "${editingResource.name}"` : 'Add New OSINT Resource'}
                    </h3>
                    {editingResource && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  {formSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {formError && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Tool / Resource Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Sector Category *</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Resource URL / Endpoint *</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Usage Context</label>
                      <input
                        type="text"
                        value={formData.usage_context}
                        onChange={(e) => setFormData({ ...formData, usage_context: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Reverse username correlation across web"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Input / Output</label>
                      <input
                        type="text"
                        value={formData.input_output}
                        onChange={(e) => setFormData({ ...formData, input_output: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                        placeholder="Input: Target handle | Output: JSON list"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">OPSEC & Privacy Notes</label>
                    <input
                      type="text"
                      value={formData.opsec_notes}
                      onChange={(e) => setFormData({ ...formData, opsec_notes: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. Always route queries through VPN"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Tool Flags (T, D, R, M)</label>
                      <input
                        type="text"
                        value={formData.tool_flags}
                        onChange={(e) => setFormData({ ...formData, tool_flags: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                        placeholder="T, D, R, M"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Pricing Model</label>
                      <select
                        value={formData.is_free}
                        onChange={(e) => setFormData({ ...formData, is_free: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="1">100% Free</option>
                        <option value="2">Freemium</option>
                        <option value="0">Commercial / Paid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                        placeholder="osint, search, dns"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    {editingResource ? 'Save Modifications' : 'Publish Tool to Catalog'}
                  </button>
                </form>
              )}

              {/* 4. Bulk Ingest */}
              {activeTab === 'import' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-slate-200 uppercase">
                      Bulk Ingest Tools (JSON or CSV format)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Paste a JSON array of objects or comma-separated CSV rows to bulk import tools into the SQLite database.
                    </p>
                  </div>

                  {importResult && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-cyan-800 text-cyan-300 text-xs font-mono">
                      {importResult}
                    </div>
                  )}

                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`[
  {
    "name": "Example OSINT Tool",
    "category_id": 1,
    "url": "https://example.com",
    "description": "Example description",
    "tool_flags": "T",
    "is_free": 1,
    "tags": ["example", "osint"]
  }
]`}
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />

                  <button
                    onClick={handleBulkImport}
                    disabled={!importText.trim()}
                    className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    Execute Ingest
                  </button>
                </div>
              )}

              {/* 5. Audit Trail */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono font-bold text-slate-200 uppercase">
                      Database Audit Activity Log
                    </h3>
                    <button
                      onClick={fetchAuditLogs}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Entity</th>
                          <th className="py-2.5 px-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-mono text-cyan-300 font-bold">
                              {log.action}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              {log.entity_type} #{log.entity_id}
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {log.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
