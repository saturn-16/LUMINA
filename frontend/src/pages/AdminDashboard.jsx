import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Shield, Building, PlusCircle, CheckCircle, MapPin, Grid, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [success, setSuccess] = useState(null);

  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    city: '',
    total_rows: 6,
    seats_per_row: 10,
    categories: [
      { name: 'Standard', color_code: '#3b82f6', tier_level: 1 },
      { name: 'VIP', color_code: '#eab308', tier_level: 2 },
    ],
  });

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/venues');
      setVenues(res.data);
    } catch (err) {
      console.error('Failed to load venues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleAddCategory = () => {
    setVenueForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { name: 'New Tier', color_code: '#a855f7', tier_level: prev.categories.length + 1 },
      ],
    }));
  };

  const handleCategoryChange = (index, field, val) => {
    setVenueForm((prev) => {
      const updated = [...prev.categories];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, categories: updated };
    });
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await api.post('/venues', {
        ...venueForm,
        total_rows: parseInt(venueForm.total_rows, 10),
        seats_per_row: parseInt(venueForm.seats_per_row, 10),
      });
      setShowVenueModal(false);
      setSuccess('Venue and auditorium seat grid generated successfully!');
      fetchVenues();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create venue.');
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 pb-24 overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Admin Console</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Auditoriums & Venue Configuration
            </h1>
          </div>

          <button
            onClick={() => setShowVenueModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2 self-start cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create Venue & Grid
          </button>
        </div>

        {success && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3 shadow-xl backdrop-blur-xl">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venues.map((v) => (
            <div
              key={v.id}
              className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{v.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{v.address}, {v.city}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {v.total_rows * v.seats_per_row} Seats
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grid Dimensions:</span>
                    <span className="font-semibold text-slate-200">{v.total_rows} Rows × {v.seats_per_row} Columns</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Configured Tiers:</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {v.categories?.map((c) => (
                        <span key={c.id} className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-slate-200">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Create Venue */}
        {showVenueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="liquid-glass border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Create New Venue & Grid</h3>
              <form onSubmit={handleCreateVenue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Grand Arena IMAX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={venueForm.city}
                      onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Mumbai"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={venueForm.address}
                      onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Bandra Kurla Complex"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Total Rows</label>
                    <input
                      type="number"
                      min={1}
                      max={26}
                      required
                      value={venueForm.total_rows}
                      onChange={(e) => setVenueForm({ ...venueForm, total_rows: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Seats per Row</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      required
                      value={venueForm.seats_per_row}
                      onChange={(e) => setVenueForm({ ...venueForm, seats_per_row: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Seat Categories
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      + Add Tier
                    </button>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {venueForm.categories.map((cat, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          value={cat.name}
                          onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-slate-200"
                          placeholder="Tier Name"
                        />
                        <input
                          type="color"
                          value={cat.color_code}
                          onChange={(e) => handleCategoryChange(idx, 'color_code', e.target.value)}
                          className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowVenueModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Generate Layout
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
