'use client';

import { useState, useEffect } from 'react';
import {
  User, Building2, Bell, Shield, CreditCard,
  Settings2, Save, LogOut, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser, getInitials } from '@/hooks/use-current-user';
import { logoutUsecase } from '@/modules/auth/usecase/auth.usecase';
import { supabase } from '@/lib/supabase/client';

const themes = [
  { id: 'light', name: 'Classic', desc: 'Warm white with gold accents', sidebar: '#0F172A', bg: '#FAFAF9', accent: '#B8860B', surface: '#FFFFFF' },
  { id: 'midnight', name: 'Midnight', desc: 'Dark premium with amber', sidebar: '#070B14', bg: '#0C111D', accent: '#D4A017', surface: '#151B2B' },
  { id: 'sapphire', name: 'Sapphire', desc: 'Modern indigo & blue', sidebar: '#1E1B4B', bg: '#F8FAFC', accent: '#3B82F6', surface: '#FFFFFF' },
  { id: 'emerald', name: 'Emerald', desc: 'Bold green authority', sidebar: '#14291E', bg: '#FAFDF7', accent: '#059669', surface: '#FFFFFF' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentTheme, setCurrentTheme] = useState('light');

  // ── Profile state, hydrated from the signed-in user ────────────────────────
  const currentUser = useCurrentUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name ?? '');
      setLastName(currentUser.last_name ?? '');
      setEmail(currentUser.email ?? '');
      setPhone(currentUser.phone ?? '');
      setCountry(currentUser.country ?? '');
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    const { error } = await supabase().auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        country,
      },
    });
    if (error) {
      toast.error('Could not update profile', { description: error.message });
      return;
    }
    toast.success('Profile updated');
  };

  const handleSignOut = async () => {
    await logoutUsecase();
    window.location.href = '/';
  };

  useEffect(() => {
    const saved = localStorage.getItem('lexram_theme');
    if (saved) {
      setCurrentTheme(saved);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('lexram_theme', themeId);
    if (themeId === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-sans font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account, firm details, and preferences.</p>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[var(--surface-hover)] border-r border-[var(--border-default)] p-4 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'profile' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]'}`}
            >
              <User className="w-4 h-4" /> Personal Profile
            </button>
            <button
              onClick={() => setActiveTab('firm')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'firm' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]'}`}
            >
              <Building2 className="w-4 h-4" /> Firm Details
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'notifications' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]'}`}
            >
              <Bell className="w-4 h-4" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'security' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]'}`}
            >
              <Shield className="w-4 h-4" /> Security
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'billing' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]'}`}
            >
              <CreditCard className="w-4 h-4" /> Billing & Plan
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'preferences' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]'}`}
            >
              <Settings2 className="w-4 h-4" /> Preferences
            </button>
          </nav>

          <div className="mt-8 pt-4 border-t border-[var(--border-default)]">
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">Personal Profile</h2>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[var(--bg-sidebar)] rounded-full flex items-center justify-center text-[var(--accent)] text-2xl font-bold shadow-sm border-2 border-[var(--bg-sidebar-hover)]">
                  {getInitials(currentUser)}
                </div>
                <div>
                  <button className="bg-[var(--bg-surface)] ring-1 ring-[var(--border-default)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors shadow-[var(--shadow-card)]">
                    Change Avatar
                  </button>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-primary)]">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-primary)]">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={handleSaveProfile} className="bg-[var(--bg-sidebar)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="max-w-xl space-y-8">
              {/* Theme Picker */}
              <div>
                <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4 mb-6">Appearance</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Choose a theme that suits your style.</p>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTheme(t.id)}
                      className={`relative group text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                        currentTheme === t.id
                          ? 'border-[var(--accent)] shadow-md ring-2 ring-[var(--ring-accent)]'
                          : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {/* Mini preview */}
                      <div className="flex rounded-lg overflow-hidden h-16 mb-2.5 border border-[var(--border-light)]" style={{ backgroundColor: t.bg }}>
                        <div className="w-6 shrink-0 flex flex-col items-center pt-2 gap-1" style={{ backgroundColor: t.sidebar }}>
                          <div className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ backgroundColor: t.accent }} />
                          <div className="w-2.5 h-1 rounded-full bg-white/20" />
                          <div className="w-2.5 h-1 rounded-full bg-white/20" />
                          <div className="w-2.5 h-1 rounded-full bg-white/20" />
                        </div>
                        <div className="flex-1 p-1.5 flex flex-col gap-1">
                          <div className="h-2 w-12 rounded-sm" style={{ backgroundColor: t.sidebar, opacity: 0.15 }} />
                          <div className="flex-1 rounded-sm" style={{ backgroundColor: t.surface }} />
                          <div className="h-2.5 w-full rounded-sm flex items-center justify-end pr-1" style={{ backgroundColor: t.surface, border: `1px solid ${t.bg === '#0C111D' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                            <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: t.accent }} />
                          </div>
                        </div>
                      </div>
                      {/* Label */}
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{ backgroundColor: t.accent, borderColor: t.accent }} />
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{t.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] leading-tight">{t.desc}</p>
                        </div>
                      </div>
                      {/* Active check */}
                      {currentTheme === t.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: t.accent }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4 mb-6">Keyboard Shortcuts</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Open Command Palette</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono font-bold text-[var(--text-muted)] shadow-[var(--shadow-card)]">⌘ K</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Go to Research</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono font-bold text-[var(--text-muted)] shadow-[var(--shadow-card)]">⌘ ⇧ R</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Go to Drafting</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono font-bold text-[var(--text-muted)] shadow-[var(--shadow-card)]">⌘ ⇧ D</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Go to Briefs</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono font-bold text-[var(--text-muted)] shadow-[var(--shadow-card)]">⌘ ⇧ B</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Go to Matters</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono font-bold text-[var(--text-muted)] shadow-[var(--shadow-card)]">⌘ ⇧ M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-light)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Close Modal / Panel</span>
                    <kbd className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono font-bold text-[var(--text-muted)] shadow-[var(--shadow-card)]">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'firm' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">Firm Details</h2>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-primary)]">Firm Name</label>
                <input type="text" defaultValue="Sharma Chambers" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-primary)]">Office Address</label>
                <textarea defaultValue="" placeholder="Enter your office address" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] h-24 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Phone Number</label>
                  <input type="tel" placeholder="+91" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-primary)]">GST Number</label>
                  <input type="text" placeholder="GSTIN" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button className="bg-[var(--bg-sidebar)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]" onClick={() => alert('Changes saved!')}>
                  <Save className="w-4 h-4" /> Save Changes
                </button>
                <span className="text-xs text-emerald-600 font-bold py-2.5 hidden">Saved!</span>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">Notification Preferences</h2>
              {[
                { label: 'Hearing reminders', desc: 'Get notified 1 day before court hearings', default: true },
                { label: 'Filing deadlines', desc: 'Alerts for upcoming filing deadlines', default: true },
                { label: 'Limitation period warnings', desc: 'Warnings when limitation periods are approaching', default: true },
                { label: 'Research updates', desc: 'Notifications when new precedents are found', default: false },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-light)]">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{pref.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{pref.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked={pref.default} className="rounded text-[var(--accent)] focus:ring-[var(--accent)]" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">Security</h2>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-primary)]">Current Password</label>
                <input type="password" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-primary)]">New Password</label>
                <input type="password" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-primary)]">Confirm New Password</label>
                <input type="password" className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button className="bg-[var(--bg-sidebar)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]" onClick={() => alert('Password updated!')}>
                  <Save className="w-4 h-4" /> Update Password
                </button>
                <span className="text-xs text-emerald-600 font-bold py-2.5 hidden">Saved!</span>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-4">Billing & Credits</h2>
              <div className="bg-[var(--bg-sidebar)] rounded-2xl p-6 text-white">
                <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Current Balance</p>
                <p className="text-4xl font-sans font-bold">500 Credits</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Free trial credits</p>
              </div>
              <a href="#pricing" className="block w-full text-center bg-[var(--accent)] text-[var(--accent-text)] py-3 rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-colors">Buy More Credits</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
