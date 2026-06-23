import React, { useState } from 'react';
import { Mail, Lock, Shield, User, ArrowRight, Sparkles } from 'lucide-react';
import { UserSession } from '../types';

interface AuthScreenProps {
  onLogin: (session: UserSession) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [email, setEmail] = useState('cyrilmelvicmeesala@gmail.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'admin' | 'participant'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate API authorization request
    setTimeout(() => {
      onLogin({
        uid: 'user_admin_123',
        email,
        role,
      });
      setIsLoading(false);
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    // Simulate Firebase / Google OAuth popup
    setTimeout(() => {
      onLogin({
        uid: 'user_google_789',
        email: 'cyrilmelvicmeesala@gmail.com',
        role,
      });
      setIsGoogleLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-brand-bg brutalist-grid">
      {/* Background Grid Accent lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="w-full max-w-md bg-black border-2 border-[#00FF00] p-8 relative z-10 shadow-[8px_8px_0px_#00FF00]">
        <div className="absolute top-2 right-2 flex gap-1.5 items-center px-1.5 py-0.5 border border-[#00FF00] text-[10px] text-[#00FF00] font-mono">
          <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></span>
          SYS ACTIVE
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#00FF00] rounded-none flex items-center justify-center mb-3 text-black">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase text-center">
            EVENT TICKET STUDIO <span className="text-xs text-[#00FF00] font-mono px-1 border border-[#00FF00] ml-1">V2.0</span>
          </h1>
          <p className="text-[11px] text-[#00FF00] font-mono tracking-wider text-center mt-2 bg-[#00FF00]/10 border border-[#00FF00]/30 px-2 py-0.5">
            DYNAMIC ATTENDEE POSTER GENERATOR
          </p>
        </div>

        {/* Role Switcher tabs */}
        <div className="grid grid-cols-2 p-1 bg-black border-2 border-white/20 mb-6">
          <button
            type="button"
            id="role-admin-btn"
            onClick={() => setRole('admin')}
            className={`py-2 text-xs uppercase font-mono tracking-widest flex items-center justify-center gap-2 transition ${
              role === 'admin'
                ? 'bg-[#00FF00] text-black font-extrabold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Organizer
          </button>
          <button
            type="button"
            id="role-participant-btn"
            onClick={() => setRole('participant')}
            className={`py-2 text-xs uppercase font-mono tracking-widest flex items-center justify-center gap-2 transition ${
              role === 'participant'
                ? 'bg-[#00FF00] text-black font-extrabold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Attendee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="email-input">
              EMAIL ADDRESS / IDENTIFIER
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#00FF00]" />
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black border-2 border-white/20 rounded-none py-2.5 pl-10 pr-4 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="password-input">
              PASSWORD / SECURITY PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#00FF00]" />
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border-2 border-white/20 rounded-none py-2.5 pl-10 pr-4 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-[#00FF00] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-[#00FF00] hover:bg-white text-black font-bold py-3 px-4 uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Continue as {role === 'admin' ? 'Organizer' : 'Attendee'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative z-10 bg-black px-3 text-[10px] text-white/40 uppercase tracking-widest font-mono">
            SECURE PROVIDER
          </span>
        </div>

        <button
          type="button"
          id="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-black border-2 border-white/20 text-white font-bold py-2.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#00FF00] hover:text-[#00FF00] transition disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {/* Google G logo SVG with neon fill adjustment */}
              <svg className="w-4 h-4 fill-current text-[#00FF00]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
          <span>SANDBOX INSTANCE</span>
          <span className="text-[#00FF00]">● ONLINE</span>
        </div>
      </div>
    </div>
  );
}
