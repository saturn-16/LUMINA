import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
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
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 selection:text-white">
          <Routes>
            {/* Landing Page as Default Entry Point */}
            <Route path="/" element={<LandingPage />} />

            {/* Events Discovery Catalog */}
            <Route path="/events" element={<Home />} />
            <Route path="/events/:eventId" element={<EventDetail />} />

            {/* Live 2D Visual Interactive Seat Map */}
            <Route path="/shows/:showId/seats" element={<SeatSelection />} />

            {/* Claim Time-Limited Waitlist Offers */}
            <Route path="/waitlist/claim" element={<WaitlistClaim />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Protected Workflows */}
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

            {/* Organiser Studio */}
            <Route
              path="/organiser"
              element={
                <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
                  <OrganiserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Console */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
