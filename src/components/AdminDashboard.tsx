import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, MapPin, Users, Ticket, Download, Trash2, Copy, Archive, ExternalLink, 
  BarChart2, FileText, Image as ImageIcon, Sparkles, AlertCircle, LogOut, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Event, DashboardStats, UserSession } from '../types';

interface AdminDashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onOpenBuilder: (event: Event) => void;
  onOpenAttendeeView: (slug: string) => void;
}

export default function AdminDashboard({ userSession, onLogout, onOpenBuilder, onOpenAttendeeView }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create Event Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventLink, setNewEventLink] = useState('');
  const [newPosterPreset, setNewPosterPreset] = useState<'tech' | 'music' | 'minimal'>('tech');
  const [customPosterBase64, setCustomPosterBase64] = useState<string | null>(null);
  const [customPosterName, setCustomPosterName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load standard presets in base64 on need
  const loadPresetPoster = (theme: 'tech' | 'music' | 'minimal') => {
    // These match the backend seeder's data URLs exactly
    if (theme === 'tech') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="%230b0b0f" />
            <stop offset="100%" stop-color="%231a1235" />
          </linearGradient>
          <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="%23d2bbff" />
            <stop offset="100%" stop-color="%23a2e7ff" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="%237c3aed" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="1200" fill="url(%23bg)" />
        <rect width="800" height="1200" fill="url(%23glow)" />
        <path d="M 0,0 L 800,0 M 0,80 L 800,80 M 0,160 L 800,160 M 0,240 L 800,240 M 0,320 L 800,320 M 0,400 L 800,400" stroke="%232a2d35" stroke-width="0.5" stroke-opacity="0.3"/>
        <path d="M 0,0 L 0,1200 M 80,0 L 80,1200 M 160,0 L 160,1200 M 240,0 L 240,1200" stroke="%232a2d35" stroke-width="0.5" stroke-opacity="0.3"/>
        <circle cx="400" cy="420" r="280" fill="none" stroke="url(%23primary)" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="8 8"/>
        <rect x="50" y="50" width="700" height="1100" rx="16" fill="none" stroke="%232a2d35" stroke-width="1.5"/>
        <text x="400" y="140" fill="%23d2bbff" font-family="system-ui, sans-serif" font-size="20" font-weight="600" letter-spacing="4" text-anchor="middle">EVENT TICKET STUDIO PRESENTS</text>
        <text x="400" y="210" fill="url(%23primary)" font-family="system-ui, sans-serif" font-size="48" font-weight="800" letter-spacing="-1" text-anchor="middle">AI INNOVATION SUMMIT</text>
        <line x1="100" y1="840" x2="700" y2="840" stroke="%232a2d35" stroke-width="1" stroke-dasharray="10 6"/>
        <circle cx="50" cy="840" r="20" fill="%230b0b0f" stroke="%232a2d35" stroke-width="1.5"/>
        <circle cx="750" cy="840" r="20" fill="%230b0b0f" stroke="%232a2d35" stroke-width="1.5"/>
        <text x="140" y="890" fill="%23958da1" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="1">DATE %26 TIME</text>
        <text x="140" y="920" fill="%23e3e2e7" font-family="system-ui, sans-serif" font-size="18" font-weight="700">June 28, 2026 @ 09:00 AM</text>
        <text x="140" y="970" fill="%23958da1" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="1">VENUE</text>
        <text x="140" y="1000" fill="%23e3e2e7" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Silicon Valley Tech Center %26 Virtual</text>
        <circle cx="400" cy="460" r="115" fill="%2315161a" stroke="%232a2d35" stroke-width="2"/>
        <text x="400" y="550" fill="%23958da1" font-family="system-ui, sans-serif" font-size="12" font-weight="500" letter-spacing="2" text-anchor="middle">PHOTO AREA</text>
      </svg>`;
    }
    if (theme === 'music') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="%230c0414" />
            <stop offset="100%" stop-color="%2328052a" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="%23ff0055" />
            <stop offset="100%" stop-color="%237c3aed" />
          </linearGradient>
        </defs>
        <rect width="800" height="1200" fill="url(%23bg)" />
        <path d="M -100,500 Q 200,300 400,600 T 900,500" fill="none" stroke="url(%23accent)" stroke-width="3" stroke-opacity="0.4"/>
        <rect x="40" y="40" width="720" height="1120" rx="24" fill="none" stroke="%233e1c5c" stroke-width="2"/>
        <text x="100" y="140" fill="%23ff0055" font-family="system-ui, sans-serif" font-size="18" font-weight="700" letter-spacing="6">NEON WAVES CLUB</text>
        <text x="100" y="220" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="64" font-weight="900" letter-spacing="-2">CYBERPUNK</text>
        <text x="100" y="285" fill="url(%23accent)" font-family="system-ui, sans-serif" font-size="64" font-weight="900" letter-spacing="-2">SOUNDWAVE</text>
        <rect x="480" y="100" width="220" height="280" rx="16" fill="%231a0b2e" stroke="url(%23accent)" stroke-width="2"/>
        <text x="590" y="250" fill="%23958da1" font-family="system-ui, sans-serif" font-size="12" font-weight="500" letter-spacing="2" text-anchor="middle">RESERVED FOR PHOTO</text>
        <line x1="80" y1="900" x2="720" y2="900" stroke="%233e1c5c" stroke-width="1.5" stroke-dasharray="12 8"/>
        <text x="100" y="960" fill="%23ff0055" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="2">ADMIT ONE PASS</text>
        <text x="100" y="1010" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="800">JULY 11, 2026</text>
      </svg>`;
    }
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
      <rect width="800" height="1200" fill="%230b0b0f" />
      <rect x="40" y="40" width="720" height="1120" stroke="%232a2d35" stroke-width="1" fill="none"/>
      <line x1="40" y1="200" x2="760" y2="200" stroke="%232a2d35" stroke-width="1"/>
      <text x="80" y="120" fill="%23e3e2e7" font-family="Georgia, serif" font-size="36" font-style="italic" font-weight="bold">Minimalist Design Forum</text>
      <text x="80" y="160" fill="%23958da1" font-family="system-ui, sans-serif" font-size="14" font-weight="600" letter-spacing="4">ESSENCE OVER SUBSTANCE</text>
      <rect x="80" y="440" width="300" height="400" fill="%2315161a" stroke="%232a2d35" stroke-width="1"/>
      <text x="230" y="650" fill="%23958da1" font-family="system-ui, sans-serif" font-size="14" font-weight="500" text-anchor="middle">OFFICIAL PHOTOGRAPH</text>
      <text x="80" y="1050" fill="%23e3e2e7" font-family="system-ui, sans-serif" font-size="20" font-weight="700">AUGUST 24, 2026</text>
    </svg>`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch('/api/analytics/dashboard');
      if (!statsRes.ok) throw new Error('Failed to load dashboard statistics.');
      const statsData: DashboardStats = await statsRes.ok ? await statsRes.json() : null;
      setStats(statsData);

      // Fetch events
      const eventsRes = await fetch('/api/events');
      if (!eventsRes.ok) throw new Error('Failed to load events list.');
      const eventsData: Event[] = await eventsRes.json();
      setEvents(eventsData);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Event Poster Custom Upload
  const handleCustomPosterFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Poster files cannot exceed 10MB limit.");
      return;
    }

    setCustomPosterName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCustomPosterBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Create Event Form
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    setIsSubmitting(true);
    try {
      // Resolve poster url
      const finalPosterUrl = customPosterBase64 || loadPresetPoster(newPosterPreset);

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEventName,
          description: newEventDesc,
          date: newEventDate,
          time: newEventTime,
          venue: newEventVenue,
          registrationLink: newEventLink,
          posterUrl: finalPosterUrl,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create event.');
      }

      const createdEvent: Event = await res.json();
      
      // Cleanup & Close
      setShowCreateModal(false);
      setNewEventName('');
      setNewEventDesc('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventVenue('');
      setNewEventLink('');
      setCustomPosterBase64(null);
      setCustomPosterName('');

      // Reload
      await loadData();

      // Instantly open the new event in the canvas template editor
      onOpenBuilder(createdEvent);
    } catch (err: any) {
      alert(err.message || 'Error occurred creating event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate Action
  const handleDuplicate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to duplicate "${name}"?`)) return;
    try {
      const res = await fetch(`/api/events/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate event.');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Archive Action
  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to change event archive status.');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Action
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All associated tickets, visits, and analytics data will be permanently wiped.`)) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event.');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-16 font-mono brutalist-grid">
      {/* Top Navbar */}
      <header className="border-b-2 border-white/20 bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#00FF00] flex items-center justify-center border border-[#00FF00]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wider uppercase font-mono">Event Ticket Studio</span>
              <span className="ml-2 text-[9px] bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 px-2 py-0.5 rounded-none uppercase tracking-widest font-mono">
                SaaS Organizer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block font-mono">
              <p className="text-[10px] text-white/40 uppercase">Logged in as</p>
              <p className="text-xs font-bold text-[#00FF00]">{userSession.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 border border-white/20 text-white/60 hover:text-white hover:bg-white/10 hover:border-white transition flex items-center gap-1 text-xs uppercase tracking-widest font-mono"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-widest font-mono">
              ANALYTICS STUDIO / DASHBOARD
            </h1>
            <p className="text-[#00FF00]/80 text-xs mt-1 font-mono uppercase">
              REAL-TIME EVENT METRICS & CAMPAGIN PERFORMANCE.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            id="create-event-btn"
            className="bg-[#00FF00] text-black font-extrabold py-2.5 px-5 rounded-none flex items-center gap-2 cursor-pointer hover:bg-white transition shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none uppercase tracking-wider text-xs font-mono"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            New Event Poster
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">An Error Occurred</p>
              <p className="text-sm text-red-200/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-28 bg-brand-surface border border-brand-border rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Quick business stats widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-black border-2 border-white/20 rounded-none p-6 relative overflow-hidden flex flex-col justify-between h-28 hover:border-[#00FF00] hover:shadow-[4px_4px_0px_#00FF00] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono">
                    Total Events
                  </span>
                  <FileText className="w-5 h-5 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight font-mono">{stats.totalEvents}</h3>
                  <p className="text-[9px] text-[#00FF00] font-mono uppercase tracking-wider mt-1">SaaS Active campaigns</p>
                </div>
              </div>

              <div className="bg-black border-2 border-white/20 rounded-none p-6 relative overflow-hidden flex flex-col justify-between h-28 hover:border-[#00FF00] hover:shadow-[4px_4px_0px_#00FF00] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono">
                    Total Visitors
                  </span>
                  <Users className="w-5 h-5 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight font-mono">
                    {stats.totalVisitors.toLocaleString()}
                  </h3>
                  <p className="text-[9px] text-[#00FF00] font-mono uppercase tracking-wider mt-1">Unique traffic visits</p>
                </div>
              </div>

              <div className="bg-black border-2 border-white/20 rounded-none p-6 relative overflow-hidden flex flex-col justify-between h-28 hover:border-[#00FF00] hover:shadow-[4px_4px_0px_#00FF00] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono">
                    Ticket Generations
                  </span>
                  <Ticket className="w-5 h-5 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight font-mono">
                    {stats.totalGenerations.toLocaleString()}
                  </h3>
                  <p className="text-[9px] text-[#00FF00] font-mono uppercase tracking-wider mt-1">
                    Conversion Rate: <span className="text-white font-bold">{stats.conversionRate.toFixed(1)}%</span>
                  </p>
                </div>
              </div>

              <div className="bg-black border-2 border-white/20 rounded-none p-6 relative overflow-hidden flex flex-col justify-between h-28 hover:border-[#00FF00] hover:shadow-[4px_4px_0px_#00FF00] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono">
                    Downloads Recorded
                  </span>
                  <Download className="w-5 h-5 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight font-mono">
                    {stats.totalDownloads.toLocaleString()}
                  </h3>
                  <p className="text-[9px] text-[#00FF00] font-mono uppercase tracking-wider mt-1">
                    Active Share Rate:{' '}
                    <span className="text-white font-bold">
                      {stats.totalGenerations > 0 
                        ? ((stats.totalDownloads / stats.totalGenerations) * 100).toFixed(0) 
                        : 0}%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Area Chart visualization of Ticket Generations */}
            <div className="bg-black border-2 border-white/20 rounded-none p-6 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase font-mono tracking-wider">
                    <BarChart2 className="w-5 h-5 text-[#00FF00]" />
                    Ticket Generation Trends
                  </h2>
                  <p className="text-[10px] text-white/40 font-mono uppercase">Daily badge and poster output for the last 7 days</p>
                </div>
                <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 px-3 py-1 text-[10px] font-mono text-[#00FF00] tracking-widest uppercase">
                  LIVE TRACKING
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.generationsHistory}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorGenerations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF00" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      className="font-mono"
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      className="font-mono"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000000', 
                        borderColor: '#00FF00', 
                        borderRadius: '0px', 
                        color: '#ffffff',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      name="Tickets Generated"
                      stroke="#00FF00" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorGenerations)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}

        {/* Managed Campaigns list section */}
        <div className="bg-black border-2 border-white/20 rounded-none p-6">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase font-mono tracking-widest">
            <FileText className="w-5 h-5 text-[#00FF00]" />
            Your Event Poster Campaigns
          </h2>

          {loading ? (
            <div className="space-y-4 font-mono">
              {[1, 2, 3].map(idx => (
                <div key={idx} className="h-16 bg-black border border-white/10 animate-pulse"></div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[#00FF00]/40 bg-black">
              <div className="w-12 h-12 bg-[#00FF00]/10 flex items-center justify-center mb-4 text-[#00FF00] border border-[#00FF00]/30">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">No campaigns active</h3>
              <p className="text-xs text-white/40 max-w-sm mt-1 font-mono uppercase">
                Upload your first poster template, place dynamic overlays, and distribute personalized tickets instantly!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 bg-[#00FF00] text-black hover:bg-white font-bold py-2 px-4 flex items-center gap-2 text-xs uppercase tracking-widest font-mono transition shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none"
              >
                <Plus className="w-4 h-4" /> Create Event Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/20 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <th className="pb-3 pr-4">Event Details</th>
                    <th className="pb-3 px-4 hidden sm:table-cell">Campaign Date</th>
                    <th className="pb-3 px-4 text-center">Visitors</th>
                    <th className="pb-3 px-4 text-center">Tickets</th>
                    <th className="pb-3 px-4 text-center">Downloads</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {events.map((evt) => (
                    <tr key={evt.id} className={`group hover:bg-[#00FF00]/5 transition ${evt.isArchived ? 'opacity-40' : ''}`}>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 border-2 border-white/20 bg-black flex-shrink-0 overflow-hidden relative">
                            {evt.posterUrl ? (
                              <img src={evt.posterUrl} alt={evt.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                            {evt.isArchived && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <span className="text-[8px] bg-white/40 text-black px-1 font-extrabold uppercase font-mono">ARC</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-[#00FF00] transition flex items-center gap-1.5 uppercase tracking-wide">
                              {evt.name}
                              {evt.elements.length === 0 && (
                                <span className="text-[9px] bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 px-1.5 py-0.2 uppercase font-mono tracking-wider">
                                  No Elements
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#00FF00] font-mono mt-1 flex items-center gap-1">
                              /{evt.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-white/60 hidden sm:table-cell uppercase font-mono">
                        {evt.date ? new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-white font-mono">
                        {evt.visitorsCount || 0}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-[#00FF00] font-mono">
                        {evt.generationsCount || 0}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-white font-mono">
                        {evt.downloadsCount || 0}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenBuilder(evt)}
                            id={`edit-builder-${evt.id}`}
                            className="p-1.5 text-white/60 hover:text-[#00FF00] border border-transparent hover:border-[#00FF00] bg-black transition"
                            title="Open Canva-Style Canvas Builder"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenAttendeeView(evt.slug)}
                            id={`view-public-${evt.id}`}
                            className="p-1.5 text-white/60 hover:text-[#00FF00] border border-transparent hover:border-[#00FF00] bg-black transition"
                            title="Open Public Attendee Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(evt.id, evt.name)}
                            id={`duplicate-${evt.id}`}
                            className="p-1.5 text-white/60 hover:text-white border border-transparent hover:border-white bg-black transition"
                            title="Duplicate Campaign"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(evt.id)}
                            id={`archive-${evt.id}`}
                            className={`p-1.5 border border-transparent bg-black transition ${
                              evt.isArchived ? 'text-[#00FF00] border-[#00FF00]' : 'text-white/60 hover:text-white hover:border-white'
                            }`}
                            title={evt.isArchived ? 'Activate Event' : 'Archive Event'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(evt.id, evt.name)}
                            id={`delete-${evt.id}`}
                            className="p-1.5 text-white/60 hover:text-red-400 border border-transparent hover:border-red-400 bg-black transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE EVENT CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs font-mono">
          <div className="w-full max-w-2xl bg-black border-2 border-[#00FF00] shadow-[8px_8px_0px_#00FF00] relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b-2 border-white/20 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00FF00]" />
                Launch Event Poster Campaign
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:text-[#00FF00] text-xl p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="event-name">
                    Event Name *
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    required
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="e.g. AI Innovation Summit 2026"
                    className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="registration-link">
                    Registration/Ticket Link (optional)
                  </label>
                  <input
                    id="registration-link"
                    type="url"
                    value={newEventLink}
                    onChange={(e) => setNewEventLink(e.target.value)}
                    placeholder="https://example.com/register"
                    className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="event-desc">
                  Event Description
                </label>
                <textarea
                  id="event-desc"
                  rows={2}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="What is this event about?"
                  className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="event-date">
                    Date
                  </label>
                  <input
                    id="event-date"
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="event-time">
                    Time
                  </label>
                  <input
                    id="event-time"
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="event-venue">
                    Venue
                  </label>
                  <input
                    id="event-venue"
                    type="text"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    placeholder="e.g. San Francisco, CA / Virtual"
                    className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
                  />
                </div>
              </div>

              {/* Poster Template Upload Selection */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Event Poster Template</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preset Selector */}
                  <div className="space-y-3">
                    <span className="block text-[9px] font-bold text-[#00FF00] tracking-widest uppercase">
                      Option A: Select From Premium Presets
                    </span>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-none border-2 cursor-pointer transition ${newPosterPreset === 'tech' && !customPosterBase64 ? 'bg-[#00FF00]/10 border-[#00FF00]' : 'bg-black border-white/10'}`}>
                        <input
                          type="radio"
                          name="poster-preset"
                          checked={newPosterPreset === 'tech' && !customPosterBase64}
                          onChange={() => {
                            setNewPosterPreset('tech');
                            setCustomPosterBase64(null);
                            setCustomPosterName('');
                          }}
                          className="accent-[#00FF00]"
                        />
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wide">AI Cybernetic Poster (Tech)</p>
                          <p className="text-[10px] text-white/40 uppercase">Obsidian dark with cyan/violet grids.</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-none border-2 cursor-pointer transition ${newPosterPreset === 'music' && !customPosterBase64 ? 'bg-[#00FF00]/10 border-[#00FF00]' : 'bg-black border-white/10'}`}>
                        <input
                          type="radio"
                          name="poster-preset"
                          checked={newPosterPreset === 'music' && !customPosterBase64}
                          onChange={() => {
                            setNewPosterPreset('music');
                            setCustomPosterBase64(null);
                            setCustomPosterName('');
                          }}
                          className="accent-[#00FF00]"
                        />
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wide">Neon Waves Rave (Music)</p>
                          <p className="text-[10px] text-white/40 uppercase">Vibrant audio waveforms with hot pink accents.</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-none border-2 cursor-pointer transition ${newPosterPreset === 'minimal' && !customPosterBase64 ? 'bg-[#00FF00]/10 border-[#00FF00]' : 'bg-black border-white/10'}`}>
                        <input
                          type="radio"
                          name="poster-preset"
                          checked={newPosterPreset === 'minimal' && !customPosterBase64}
                          onChange={() => {
                            setNewPosterPreset('minimal');
                            setCustomPosterBase64(null);
                            setCustomPosterName('');
                          }}
                          className="accent-[#00FF00]"
                        />
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wide">Swiss Minimalist Poster</p>
                          <p className="text-[10px] text-white/40 uppercase">High-contrast grids and clean serif fonts.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Manual File Upload */}
                  <div className="space-y-3">
                    <span className="block text-[9px] font-bold text-[#00FF00] tracking-widest uppercase">
                      Option B: Upload Custom Poster Template
                    </span>
                    <div className="border-2 border-dashed border-white/20 bg-black rounded-none p-4 flex flex-col items-center justify-center text-center h-[190px] relative">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleCustomPosterFile}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        id="custom-poster-upload"
                      />
                      <ImageIcon className="w-8 h-8 text-[#00FF00] mb-2" />
                      {customPosterName ? (
                        <div className="z-20 text-[10px] uppercase px-2 py-1 bg-white/10 text-[#00FF00] border border-[#00FF00]/30 rounded-none flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-[#00FF00]" />
                          {customPosterName.substring(0, 20)}...
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">Drag &amp; Drop or Upload</p>
                          <p className="text-[10px] text-white/40 uppercase mt-1">PNG, JPG, WEBP up to 10MB</p>
                        </>
                      )}
                      {customPosterBase64 && (
                        <p className="text-[9px] text-[#00FF00] font-bold mt-2 z-20 uppercase tracking-widest">
                          [Custom Template Overrides Presets]
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border-2 border-white/20 bg-black hover:border-white text-white transition text-xs font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="create-modal-submit-btn"
                  disabled={isSubmitting}
                  className="bg-[#00FF00] text-black font-extrabold py-2 px-5 rounded-none flex items-center gap-2 cursor-pointer hover:bg-white transition shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none text-xs uppercase tracking-widest font-mono"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Create &amp; Define Overlays
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
