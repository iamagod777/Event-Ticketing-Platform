import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Shield, User, RefreshCw, AlertCircle, Layout, ExternalLink, Play
} from 'lucide-react';
import { Event, UserSession, GeneratedTicket, TemplateElement } from './types';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import TemplateEditor from './components/TemplateEditor';
import AttendeeView from './components/AttendeeView';
import TicketResult from './components/TicketResult';

export default function App() {
  const [activeView, setActiveView] = useState<'auth' | 'admin' | 'editor' | 'attendee' | 'result'>('auth');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<GeneratedTicket | null>(null);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Load active campaigns for routing list
  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEventsList(data);
        
        // Default to first active tech event if not set yet
        if (data.length > 0 && !selectedEvent) {
          setSelectedEvent(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to preload events list', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Handle URL parameters or simulated route checking
  useEffect(() => {
    const checkHashRoute = () => {
      const queryParams = new URLSearchParams(window.location.search);
      const eventSlug = queryParams.get('event');
      if (eventSlug && eventsList.length > 0) {
        const match = eventsList.find(e => e.slug === eventSlug);
        if (match) {
          setSelectedEvent(match);
          setActiveView('attendee');
        }
      }
    };
    if (eventsList.length > 0) {
      checkHashRoute();
    }
  }, [eventsList]);

  // Auth logins handler
  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    if (session.role === 'admin') {
      setActiveView('admin');
    } else {
      // Default participant to the first active campaign
      if (eventsList.length > 0) {
        setSelectedEvent(eventsList[0]);
      }
      setActiveView('attendee');
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    setActiveView('auth');
  };

  // Open Template Editor Canvas
  const handleOpenBuilder = (evt: Event) => {
    setSelectedEvent(evt);
    setActiveView('editor');
  };

  // Save overlays template parameters
  const handleSaveTemplateOverlays = async (updatedElements: TemplateElement[]) => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: updatedElements }),
      });

      if (!res.ok) throw new Error('API update failed');
      const savedEvent = await res.json();
      
      // Update local states
      setSelectedEvent(savedEvent);
      await loadEvents();
    } catch (err) {
      console.error('Save template overrides failed', err);
      throw err;
    }
  };

  // Public Event Attendee link handler
  const handleOpenAttendeePage = (slug: string) => {
    const match = eventsList.find(e => e.slug === slug);
    if (match) {
      setSelectedEvent(match);
      setActiveView('attendee');
    }
  };

  // Ticket Result viewer handler
  const handleShowTicketResult = (ticket: GeneratedTicket) => {
    setSelectedTicket(ticket);
    setActiveView('result');
  };

  // Reset to campaign form
  const handleGenerateAnother = () => {
    setSelectedTicket(null);
    setActiveView('attendee');
  };

  const handleBackToDashboard = () => {
    setActiveView('admin');
  };

  return (
    <div className="min-h-screen relative bg-brand-bg select-text">
      
      {/* Dynamic Screen View Router */}
      {activeView === 'auth' && (
        <AuthScreen onLogin={handleLogin} />
      )}

      {activeView === 'admin' && userSession && (
        <AdminDashboard 
          userSession={userSession}
          onLogout={handleLogout}
          onOpenBuilder={handleOpenBuilder}
          onOpenAttendeeView={handleOpenAttendeePage}
        />
      )}

      {activeView === 'editor' && selectedEvent && (
        <TemplateEditor 
          event={selectedEvent}
          onClose={handleBackToDashboard}
          onSave={handleSaveTemplateOverlays}
        />
      )}

      {activeView === 'attendee' && selectedEvent && (
        <AttendeeView 
          event={selectedEvent}
          onBackToDashboard={handleBackToDashboard}
          onShowTicketResult={handleShowTicketResult}
        />
      )}

      {activeView === 'result' && selectedTicket && selectedEvent && (
        <TicketResult 
          ticket={selectedTicket}
          eventSlug={selectedEvent.slug}
          onGenerateAnother={handleGenerateAnother}
          onBackToDashboard={handleBackToDashboard}
        />
      )}

      {/* SANDBOX CAMPAIGN TESTING BELT - FIXED AT BOTTOM */}
      {activeView !== 'auth' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black border-2 border-white rounded-none py-2 px-4 flex items-center gap-4 shadow-[4px_4px_0px_#00FF00] z-50 text-[10px] font-mono max-w-lg whitespace-nowrap uppercase">
          <span className="text-white/40 font-bold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#00FF00]" />
            SANDBOX:
          </span>
          <div className="h-4 w-px bg-white/20"></div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1 rounded-none font-bold uppercase transition cursor-pointer ${activeView === 'admin' ? 'bg-[#00FF00] text-black' : 'text-white/40 hover:text-white'}`}
            >
              ADMIN
            </button>
            <button
              onClick={() => {
                if (eventsList.length > 0) {
                  setSelectedEvent(eventsList[0]);
                  setActiveView('attendee');
                }
              }}
              className={`px-3 py-1 rounded-none font-bold uppercase transition cursor-pointer ${activeView === 'attendee' ? 'bg-[#00FF00] text-black' : 'text-white/40 hover:text-white'}`}
            >
              PUBLIC
            </button>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-white/40">CAMPAIGN:</span>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const match = eventsList.find(ev => ev.id === e.target.value);
                if (match) {
                  setSelectedEvent(match);
                  if (activeView !== 'editor') {
                    setActiveView('attendee');
                  }
                }
              }}
              className="bg-black text-white border border-white/20 rounded-none px-2 py-0.5 text-[10px] focus:outline-none focus:border-[#00FF00] uppercase font-bold"
            >
              {eventsList.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name.split(' ')[0]}...</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
