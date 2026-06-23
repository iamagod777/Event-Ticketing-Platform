import React, { useState } from 'react';
import { 
  Download, Share2, ArrowLeft, CheckCircle, RefreshCw, Send, 
  Linkedin, MessageCircle, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { GeneratedTicket } from '../types';

interface TicketResultProps {
  ticket: GeneratedTicket;
  eventSlug: string;
  onGenerateAnother: () => void;
  onBackToDashboard: () => void;
}

export default function TicketResult({ ticket, eventSlug, onGenerateAnother, onBackToDashboard }: TicketResultProps) {
  const [downloading, setDownloading] = useState(false);

  // Trigger local browser file download
  const handleDownload = async (format: 'png' | 'jpg') => {
    setDownloading(true);
    try {
      // Log download metric in analytics
      await fetch(`/api/events/${ticket.eventId}/download`, { method: 'POST' });

      const link = document.createElement('a');
      link.href = ticket.ticketImageUrl;
      link.download = `ticket-${ticket.attendeeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Analytics download logging failed', err);
    } finally {
      setDownloading(false);
    }
  };

  // Pre-configured social URLs
  const getEventPublicUrl = () => {
    return `${window.location.origin}/event/${eventSlug}`;
  };

  const getShareText = () => {
    return encodeURIComponent(
      `I'm attending ${ticket.eventName}! Check out my personalized poster ticket and generate your own here: ${getEventPublicUrl()}`
    );
  };

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${getShareText()}`, '_blank');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getEventPublicUrl())}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative font-mono text-xs">
      {/* Back to dashboard */}
      <div className="max-w-5xl mx-auto px-6 pt-6 flex justify-between items-center relative z-20">
        <button
          onClick={onBackToDashboard}
          className="text-xs text-white/60 hover:text-[#00FF00] flex items-center gap-1.5 bg-black border-2 border-white/20 px-3 py-1.5 rounded-none transition uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard Overview
        </button>
        <span className="text-[9px] bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 px-2.5 py-1 rounded-none uppercase tracking-widest font-mono font-extrabold">
          GENERATION SUCCESS
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 animate-fade-in">
        
        {/* Left Column: Final Compiled Ticket Poster Image */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[380px] aspect-[2/3] rounded-none overflow-hidden shadow-[8px_8px_0px_#00FF00] border-4 border-white bg-black relative group">
            {/* Reflective light glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none group-hover:via-white/10 transition-all duration-700"></div>
            
            {ticket.ticketImageUrl ? (
              <img 
                src={ticket.ticketImageUrl} 
                alt="Your Generated Ticket" 
                className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-[1.01]" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-2">
                <ImageIcon className="w-12 h-12 text-white/20" />
                <p className="uppercase font-bold tracking-wider">Error rendering compiled poster</p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-white/40 mt-4 text-center uppercase tracking-wide">
            Right-click above or use buttons below to save poster.
          </p>
        </div>

        {/* Right Column: Downloads & Social Sharing Options */}
        <div className="lg:col-span-6 space-y-8 bg-black border-2 border-white/25 rounded-none p-8 relative shadow-[10px_10px_0px_#00FF00] min-h-[450px]">
          
          <div>
            <div className="w-12 h-12 rounded-none bg-black border-2 border-[#00FF00] flex items-center justify-center text-[#00FF00] mb-4">
              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              Poster Generated Successfully!
            </h1>
            <p className="text-xs text-white/60 mt-2 leading-relaxed uppercase">
              Congratulations! Your personalized <strong className="text-white">"I'm Attending"</strong> event ticket has been generated with custom overlays, cropping, and dynamic layout parameters.
            </p>
          </div>

          {/* Attendee Info Summary Badge */}
          <div className="bg-black border border-white/20 rounded-none p-4 space-y-2 uppercase">
            <span className="text-[9px] font-bold text-[#00FF00] tracking-widest block font-mono">// ATTENDEE DATA</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-white/40">Attendee Name</span>
                <p className="font-bold text-white mt-0.5">{ticket.attendeeName}</p>
              </div>
              <div>
                <span className="text-white/40">Campaign Event</span>
                <p className="font-bold text-[#00FF00] mt-0.5 truncate max-w-[180px]" title={ticket.eventName}>{ticket.eventName}</p>
              </div>
            </div>
          </div>

          {/* Core download controls */}
          <div className="space-y-3">
            <span className="block text-[10px] font-bold text-white/40 tracking-widest uppercase">
              Save File Locally
            </span>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDownload('png')}
                disabled={downloading}
                className="bg-[#00FF00] border-2 border-[#00FF00] text-black font-extrabold py-3 px-4 rounded-none flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition cursor-pointer hover:bg-white hover:border-white active:scale-95"
              >
                <Download className="w-4 h-4 text-black stroke-[2.5]" />
                Download PNG
              </button>
              <button
                onClick={() => handleDownload('jpg')}
                disabled={downloading}
                className="bg-black border-2 border-white/20 hover:border-white text-white font-extrabold py-3 px-4 rounded-none flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-white" />
                Download JPG
              </button>
            </div>
            <p className="text-[10px] text-white/40 text-center leading-relaxed uppercase tracking-wider">
              Files are high resolution, optimized for LinkedIn, WhatsApp, Instagram, and X.
            </p>
          </div>

          {/* Social shares */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <span className="block text-[10px] font-bold text-white/40 tracking-widest uppercase">
              Share with Your Network
            </span>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleWhatsAppShare}
                className="bg-[#25D366]/10 border-2 border-[#25D366]/30 hover:bg-[#25D366]/20 text-white font-bold py-2.5 px-4 rounded-none flex items-center justify-center gap-2 text-xs transition uppercase tracking-wider cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                WhatsApp Share
              </button>
              <button
                onClick={handleLinkedInShare}
                className="bg-[#0077B5]/10 border-2 border-[#0077B5]/30 hover:bg-[#0077B5]/20 text-white font-bold py-2.5 px-4 rounded-none flex items-center justify-center gap-2 text-xs transition uppercase tracking-wider cursor-pointer"
              >
                <Linkedin className="w-4 h-4 text-[#0077B5]" />
                LinkedIn Share
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onGenerateAnother}
              className="w-full sm:w-auto bg-black border-2 border-white/20 hover:border-[#00FF00] hover:text-[#00FF00] text-white font-bold py-2.5 px-5 rounded-none flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate Another
            </button>
            <p className="text-[10px] text-white/40 text-center sm:text-left uppercase">
              Share your ticket with other peers to increase campaign reach.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
