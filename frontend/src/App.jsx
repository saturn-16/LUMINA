import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import BookingConfirmation from './pages/BookingConfirmation';
import CustomerDashboard from './pages/CustomerDashboard';
import WaitlistClaim from './pages/WaitlistClaim';
import OrganiserDashboard from './pages/OrganiserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/events/:eventId" element={<EventDetail />} />
              <Route path="/shows/:showId/seats" element={<SeatSelection />} />
              <Route path="/waitlist/claim" element={<WaitlistClaim />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Protected Routes */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/confirmation"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                    <BookingConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANISER', 'ADMIN']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Organiser Routes */}
              <Route
                path="/organiser"
                element={
                  <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
                    <OrganiserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="font-semibold text-slate-400">
                TicketBox • Cinema & Concert Seating System
              </div>
              <div>
                Real-time WebSockets • Row-Level Lock Concurrency Protection • Automated Waitlists
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
