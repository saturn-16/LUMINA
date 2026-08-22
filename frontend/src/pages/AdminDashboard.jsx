import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, MapPin, Building, Users, DollarSign, Plus, X, Layers, Check } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    city: '',
    total_rows: 6,
    total_cols: 8,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, venuesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/venues'),
      ]);
      setStats(statsRes.data);
      setVenues(venuesRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/venues', {
        ...venueForm,
        total_rows: parseInt(venueForm.total_rows, 10),
        total_cols: parseInt(venueForm.total_cols, 10),
        categories: [
          { name: 'Standard', color_code: '#3B82F6', tier_level: 1 },
          { name: 'Premium', color_code: '#8B5CF6', tier_level: 2 },
          { name: 'VIP', color_code: '#F59E0B', tier_level: 3 },
        ],
      });
      setShowVenueModal(false);
      setVenueForm({
        name: '',
        address: '',
        city: '',
        total_rows: 6,
        total_cols: 8,
      });
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create venue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">System Administration</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Admin Console & Venue Layouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure auditorium grids, manage seat categories, and oversee system metrics.
          </p>
        </div>

        <button
          onClick={() => setShowVenueModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create New Venue
        </button>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Users</div>
          <div className="text-2xl font-black text-white mt-1">{stats?.total_users || 0}</div>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Venues</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats?.total_venues || 0}</div>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">Active Shows</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{stats?.total_shows || 0}</div>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 font-semibold uppercase">System Revenue</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ${stats?.total_revenue?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {/* Venues & Seat Layout Configurations */}
      <div>
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Building className="w-5 h-5 text-amber-400" />
          Auditoriums & Physical Seat Layouts
        </h2>

        {venues.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
            No venues found. Create one to begin scheduling events.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {venues.map((v) => (
              <div key={v.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{v.name}</h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {v.total_rows * v.total_cols} Physical Seats
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{v.address}, {v.city}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grid Dimensions:</span>
                      <span className="font-mono text-slate-200">{v.total_rows} Rows × {v.total_cols} Columns</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Row Labels:</span>
                      <span className="font-mono text-slate-200">A to {String.fromCharCode(64 + v.total_rows)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">Configured Tiers</div>
                    <div className="flex flex-wrap gap-2">
                      {v.categories?.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                        >
                          {cat.name} (Tier {cat.tier_level})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                  Ready for per-show seat allocation & dynamic pricing.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Venue Modal */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Create Venue & Seat Grid</h3>
              <button onClick={() => setShowVenueModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVenue} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal IMAX Cinema Hall"
                  value={venueForm.name}
                  onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. San Francisco"
                    value={venueForm.city}
                    onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 Howard St"
                    value={venueForm.address}
                    onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Rows (A-Z)</label>
                  <input
                    type="number"
                    min="1"
                    max="26"
                    required
                    value={venueForm.total_rows}
                    onChange={(e) => setVenueForm({ ...venueForm, total_rows: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Columns per Row</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={venueForm.total_cols}
                    onChange={(e) => setVenueForm({ ...venueForm, total_cols: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span className="font-bold text-amber-300">Default Category Tiers:</span> Standard, Premium, and VIP Recliner categories will be auto-generated and distributed across rows.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Generating Seats...' : 'Create & Generate Grid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
