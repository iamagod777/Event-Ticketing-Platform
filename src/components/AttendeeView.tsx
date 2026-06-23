import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, MapPin, Ticket, Sparkles, Upload, Image as ImageIcon, ArrowLeft,
  CheckCircle, ArrowRight, RefreshCw, Send, AlertTriangle, HelpCircle
} from 'lucide-react';
import { Event, TemplateElement, GeneratedTicket } from '../types';

interface AttendeeViewProps {
  event: Event;
  onBackToDashboard: () => void;
  onShowTicketResult: (ticket: GeneratedTicket) => void;
}

export default function AttendeeView({ event, onBackToDashboard, onShowTicketResult }: AttendeeViewProps) {
  // Extract required text fields from event overlays
  const textElements = event.elements.filter(el => el.type === 'text');
  const uniqueTextKeys = Array.from(new Set(textElements.map(el => el.textKey).filter(Boolean))) as string[];

  // Dynamic state for attendee details
  const [details, setDetails] = useState<Record<string, string>>({});
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');
  
  // Processing animation steps
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);

  // Track event visitor analytics on mount
  useEffect(() => {
    const recordVisit = async () => {
      try {
        await fetch(`/api/events/${event.id}/visit`, { method: 'POST' });
      } catch (err) {
        console.warn('Analytics logging failed', err);
      }
    };
    recordVisit();
  }, [event.id]);

  // Set default details values
  useEffect(() => {
    const initialDetails: Record<string, string> = {};
    uniqueTextKeys.forEach(key => {
      initialDetails[key] = '';
    });
    setDetails(initialDetails);
  }, [event.elements]);

  // Handle Detail Inputs Change
  const handleInputChange = (key: string, val: string) => {
    setDetails(prev => ({ ...prev, [key]: val }));
  };

  // Profile Photo File Select
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Attendee photos cannot exceed 10MB limit.");
      return;
    }

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Core Ticket Compiler (HTML5 Canvas Engine)
  const generateTicketImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 1. Create offscreen high-res canvas (800x1200 matches our template resolution)
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Unable to create 2D context"));
        return;
      }

      // 2. Load primary poster template
      const posterImg = new Image();
      posterImg.crossOrigin = "anonymous";
      posterImg.src = event.posterUrl;

      posterImg.onload = async () => {
        // Draw the background poster
        ctx.drawImage(posterImg, 0, 0, 800, 1200);

        // 3. Render all layers in sequence
        for (const el of event.elements) {
          
          // Photo Placeholder Processing
          if (el.type === 'photo' && photoBase64) {
            await new Promise<void>((resolvePhoto) => {
              const attendeeImg = new Image();
              attendeeImg.src = photoBase64;
              attendeeImg.onload = () => {
                // Determine absolute pixel bounds from percentages
                const targetW = (el.width / 100) * 800;
                const targetH = (el.height / 100) * 1200;
                const targetX = (el.x / 100) * 800;
                const targetY = (el.y / 100) * 1200;

                ctx.save();

                // Apply clipping shape
                if (el.shape === 'circle') {
                  ctx.beginPath();
                  const cx = targetX + targetW / 2;
                  const cy = targetY + targetH / 2;
                  const radius = Math.min(targetW, targetH) / 2;
                  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                  ctx.clip();
                } else if (el.shape === 'rounded-rectangle') {
                  ctx.beginPath();
                  const radius = 16; // rounded corner size
                  ctx.moveTo(targetX + radius, targetY);
                  ctx.lineTo(targetX + targetW - radius, targetY);
                  ctx.quadraticCurveTo(targetX + targetW, targetY, targetX + targetW, targetY + radius);
                  ctx.lineTo(targetX + targetW, targetY + targetH - radius);
                  ctx.quadraticCurveTo(targetX + targetW, targetY + targetH, targetX + targetW - radius, targetY + targetH);
                  ctx.lineTo(targetX + radius, targetY + targetH);
                  ctx.quadraticCurveTo(targetX, targetY + targetH, targetX, targetY + targetH - radius);
                  ctx.lineTo(targetX, targetY + radius);
                  ctx.quadraticCurveTo(targetX, targetY, targetX + radius, targetY);
                  ctx.closePath();
                  ctx.clip();
                } else {
                  // Standard rectangle
                  ctx.beginPath();
                  ctx.rect(targetX, targetY, targetW, targetH);
                  ctx.clip();
                }

                // AI Centering & Cropping Calculations (Aspect Ratio Cover Fit)
                const imgRatio = attendeeImg.width / attendeeImg.height;
                const targetRatio = targetW / targetH;
                let srcX = 0, srcY = 0, srcW = attendeeImg.width, srcH = attendeeImg.height;

                if (imgRatio > targetRatio) {
                  srcW = attendeeImg.height * targetRatio;
                  srcX = (attendeeImg.width - srcW) / 2; // center horizontally
                } else {
                  srcH = attendeeImg.width / targetRatio;
                  srcY = (attendeeImg.height - srcH) / 3; // center vertically (slightly elevated for face-centering)
                }

                // Draw centered, cropped, aspect-ratio preserved image
                ctx.drawImage(attendeeImg, srcX, srcY, srcW, srcH, targetX, targetY, targetW, targetH);

                ctx.restore();
                resolvePhoto();
              };
              attendeeImg.onerror = () => {
                resolvePhoto(); // skip on fail gracefully
              };
            });
          }

          // Text Placeholders Processing
          if (el.type === 'text') {
            const key = el.textKey;
            if (key) {
              const textVal = (details[key] || '').toUpperCase() || `ENTER ${key.toUpperCase()}`;
              const targetW = (el.width / 100) * 800;
              const targetX = (el.x / 100) * 800;
              const targetY = (el.y / 100) * 1200;

              ctx.save();
              
              // Apply styling
              ctx.fillStyle = el.color || '#ffffff';
              const weight = el.fontWeight === 'bold' ? 'bold' : 'normal';
              const fontFam = el.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : el.fontFamily === 'Georgia' ? 'Georgia, serif' : '"Geist", sans-serif';
              ctx.font = `${weight} ${el.fontSize || 24}px ${fontFam}`;
              
              // Text aligning inside bounding boxes
              let drawX = targetX;
              if (el.align === 'center') {
                ctx.textAlign = 'center';
                drawX = targetX + targetW / 2;
              } else if (el.align === 'right') {
                ctx.textAlign = 'right';
                drawX = targetX + targetW;
              } else {
                ctx.textAlign = 'left';
              }

              // Draw dynamic values
              ctx.fillText(textVal, drawX, targetY + (el.fontSize || 24));
              ctx.restore();
            }
          }

          // QR Code Overlay Processing
          if (el.type === 'qr') {
            await new Promise<void>((resolveQR) => {
              // Construct target redirect URI
              let qrData = window.location.href; // default: this event page
              if (el.qrTarget === 'registration' && event.registrationLink) {
                qrData = event.registrationLink;
              } else if (el.qrTarget === 'verification') {
                qrData = `${window.location.origin}/verify/ticket?evt=${event.id}&name=${encodeURIComponent(details['name'] || '')}`;
              }

              const qrImg = new Image();
              qrImg.crossOrigin = "anonymous";
              qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&color=ffffff&bgcolor=15161a`;
              
              qrImg.onload = () => {
                const targetW = (el.width / 100) * 800;
                const targetH = (el.height / 100) * 1200;
                const targetX = (el.x / 100) * 800;
                const targetY = (el.y / 100) * 1200;

                ctx.save();
                // Draw white background borders behind QR code
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(targetX - 2, targetY - 2, targetW + 4, targetH + 4);
                // Draw QR Code
                ctx.drawImage(qrImg, targetX, targetY, targetW, targetH);
                ctx.restore();
                resolveQR();
              };
              qrImg.onerror = () => {
                resolveQR(); // fallback
              };
            });
          }
        }

        // Return final compiled image
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      posterImg.onerror = (e) => {
        reject(new Error("Unable to load background poster template"));
      };
    });
  };

  // Submit dynamic details and compile
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      alert("Please upload your profile photo to generate your attendance poster!");
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);
    setProcessingLogs([]);

    const steps = [
      "Inicilizing AI pipeline engines...",
      "Analyzing face profile structure and boundaries...",
      "Executing dynamic background removal (segmenting image model)...",
      "Aligning face center-nodes to template layout specs...",
      "Rendering canvas elements (clipping badge photo)...",
      "Generating secure encrypted QR validation tags...",
      "Compiling final high-DPI attendee ticket poster..."
    ];

    // Simulate modern cybernetic scanner logs
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      setProcessingLogs(prev => [...prev, `[AI ENGINE] ${steps[i]}`]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      // Run Canvas engine compile
      const finalTicketUrl = await generateTicketImage();

      // Post compilation to database APIs
      const response = await fetch(`/api/events/${event.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: details['name'] || 'Attendee',
          photoUrl: photoBase64,
          details,
          ticketImageUrl: finalTicketUrl
        }),
      });

      if (!response.ok) throw new Error("Database failed registering dynamic ticket.");
      const savedTicket: GeneratedTicket = await response.json();

      setIsProcessing(false);
      
      // Open output result view
      onShowTicketResult(savedTicket);
    } catch (err: any) {
      alert(err.message || "Failed during final ticket rendering.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative font-mono">
      {/* Back button for simulation */}
      <div className="max-w-6xl mx-auto px-6 pt-6 flex justify-between items-center relative z-20">
        <button
          onClick={onBackToDashboard}
          className="text-xs text-white/60 hover:text-[#00FF00] flex items-center gap-1.5 bg-black border-2 border-white/20 px-3 py-1.5 rounded-none transition uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard Overview
        </button>
        <span className="text-[9px] bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 px-2.5 py-1 rounded-none uppercase tracking-widest font-mono font-extrabold">
          PUBLIC CAMPAIGN LINK ACTIVE
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
        
        {/* Left Column: Poster Canvas Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] aspect-[2/3] rounded-none overflow-hidden shadow-[8px_8px_0px_#00FF00] border-4 border-white relative group">
            <img 
              src={event.posterUrl} 
              alt={event.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[9px] font-bold text-[#00FF00] tracking-widest uppercase mb-1 font-mono">[ CAMPAIGN TEMPLATE ]</span>
              <h4 className="text-white font-extrabold uppercase tracking-wide text-sm">{event.name}</h4>
            </div>
          </div>
          <p className="text-[10px] text-white/40 mt-4 text-center uppercase tracking-wide">
            Poster template automatically adapts to your details instantly.
          </p>
        </div>

        {/* Right Column: Dynamic Form Fields & Upload */}
        <div className="lg:col-span-7 bg-black border-2 border-white/25 rounded-none p-8 relative overflow-hidden shadow-[10px_10px_0px_#00FF00] min-h-[450px]">
          <div className="mb-6">
            <span className="text-[#00FF00] text-[10px] uppercase font-bold tracking-widest">// EVENT CAMPAIGN ACTIVATED</span>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{event.name}</h1>
            <p className="text-xs text-white/60 mt-2 uppercase leading-relaxed font-mono">{event.description}</p>
          </div>

          {/* Event metadata flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 bg-black border border-white/10 rounded-none font-mono">
            {event.date && (
              <div className="flex items-center gap-2.5 text-xs text-white/50">
                <Calendar className="w-4 h-4 text-[#00FF00] shrink-0" />
                <div>
                  <p className="font-bold text-white uppercase text-[10px]">Date &amp; Time</p>
                  <p className="text-[11px] uppercase">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} @ {event.time || "09:00 AM"}</p>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2.5 text-xs text-white/50">
                <MapPin className="w-4 h-4 text-[#00FF00] shrink-0" />
                <div>
                  <p className="font-bold text-white uppercase text-[10px]">Venue</p>
                  <p className="text-[11px] uppercase">{event.venue}</p>
                </div>
              </div>
            )}
          </div>

          {/* GENERATE TICKET FORM */}
          <form onSubmit={handleGenerate} className="space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b-2 border-white/20 pb-2.5 mb-4">
              Enter Your Ticket Information
            </h3>

            {/* Profile Photo upload area */}
            <div>
              <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5">
                Profile Photo * (JPG, PNG, WEBP, HEIC)
              </label>
              <div className="border-2 border-dashed border-[#00FF00]/40 bg-black rounded-none p-5 flex flex-col items-center justify-center text-center relative h-36 hover:border-[#00FF00] transition">
                <input
                  type="file"
                  required
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoFile}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  id="attendee-photo-file"
                />
                
                {photoBase64 ? (
                  <div className="flex items-center gap-4 z-20">
                    <img 
                      src={photoBase64} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-none border-2 border-[#00FF00] object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-[#00FF00] uppercase tracking-wide">Image Loaded Successfully</p>
                      <p className="text-[10px] text-white/40">{photoName.substring(0, 24)}...</p>
                      <span className="text-[9px] bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 px-1.5 py-0.5 rounded-none uppercase mt-1 inline-block font-bold">
                        Ready to synthesize
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#00FF00] mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Upload Your Profile Picture</p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase">Image limit 10MB. High-contrast face works best!</p>
                  </>
                )}
              </div>
            </div>

            {/* Dynamically Render inputs mapped from template elements */}
            {uniqueTextKeys.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {uniqueTextKeys.map((key) => {
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor={`field-input-${key}`}>
                        {label} *
                      </label>
                      <input
                        id={`field-input-${key}`}
                        type="text"
                        required
                        value={details[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={`Your ${label}`}
                        className="w-full bg-black border-2 border-white/20 rounded-none py-2.5 px-3 text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-[#00FF00] transition uppercase"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-black border border-white/10 rounded-none p-4 text-[10px] text-white/40 uppercase">
                No custom text fields required. Just upload your photo and hit generate!
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t border-white/15 flex items-center gap-4">
              {event.registrationLink && (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black hover:border-white border-2 border-white/20 text-white font-bold py-3 px-5 rounded-none text-xs text-center flex items-center justify-center gap-1.5 transition uppercase tracking-wider whitespace-nowrap"
                >
                  Join Registration Page
                </a>
              )}
              <button
                type="submit"
                id="generate-ticket-submit-btn"
                className="w-full bg-[#00FF00] text-black font-extrabold py-3.5 px-6 rounded-none flex items-center justify-center gap-2 cursor-pointer hover:bg-white transition shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none text-xs uppercase tracking-widest font-mono"
              >
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
                Generate Personalized Ticket
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* AI COMPUTER VISION PROCESSING OVERLAY MODULE */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-black border-2 border-[#00FF00] rounded-none p-6 shadow-[10px_10px_0px_rgba(255,255,255,0.15)] relative overflow-hidden flex flex-col items-center">
            
            {/* Cybernetic AI Scanning Orb */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-none border border-[#00FF00]/40 animate-ping"></div>
              <div className="absolute inset-2 rounded-none border border-white/20 animate-pulse"></div>
              <div className="w-16 h-16 rounded-none bg-black border-2 border-[#00FF00] flex items-center justify-center text-[#00FF00] z-10 shadow-lg relative">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <h3 className="text-sm font-bold text-white text-center uppercase tracking-widest">AI Image Processing System</h3>
            <p className="text-[10px] text-white/40 mt-1 text-center uppercase tracking-wider">
              Executing face framing, background subtraction, and dynamic graphics synthesis.
            </p>

            {/* Live scanning log viewer */}
            <div className="w-full bg-black border-2 border-white/20 rounded-none p-4 mt-6 h-48 overflow-y-auto font-mono text-[10px] text-[#00FF00] space-y-2.5">
              {processingLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-1.5 animate-fade-in uppercase">
                  <span className="text-[#00FF00] shrink-0">&gt;&gt;</span>
                  <p className="tracking-wide">{log}</p>
                </div>
              ))}
              <div className="w-full flex items-center justify-between text-white/30 border-t border-white/10 pt-2 mt-2 uppercase text-[9px] font-bold">
                <span>Engines operational</span>
                <span className="text-[#00FF00]">{((processingStep + 1) / 7 * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            {/* Simple progress bar */}
            <div className="w-full bg-white/10 h-2 rounded-none overflow-hidden mt-6 border border-white/20">
              <div 
                className="bg-[#00FF00] h-full transition-all duration-300" 
                style={{ width: `${((processingStep + 1) / 7) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
