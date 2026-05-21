import React, { useState } from 'react';
import { User as UserIcon, Bell, Shield, ChevronRight, UserCircle } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import { useAuth } from '../../../context/AuthContext';

export default function UserProfilePage() {
  const { businessType, user } = useAuth();
  const isPharma = businessType === 'pharma';
  const [activeTab, setActiveTab] = useState('info');

  const sections = [
    {
      title: 'Profile',
      tabs: [
        { id: 'info', label: 'Profile Info', desc: 'Personal details', icon: UserCircle },
        { id: 'security', label: 'Security', desc: 'Passwords & sessions', icon: Shield },
        { id: 'notifications', label: 'Notifications', desc: 'Alerts & digests', icon: Bell },
      ],
    },
  ];

  return (
    <div>
      <PageHeader 
        title="User Profile" 
        subtitle="Manage your account preferences and security"
        breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'User Profile' }]}
      />
      <div className="page-content">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar Navigation ── */}
          <div className="w-full lg:w-[272px] flex-shrink-0">
            <div className="card-pro overflow-hidden" style={{ padding: 0 }}>
              {/* Sidebar header */}
              <div style={{ padding: '18px 20px 14px' }} className="border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md ${isPharma ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'} flex items-center justify-center shadow-sm`}>
                    <UserIcon size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider leading-none">Account</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">2 modules</p>
                  </div>
                </div>
              </div>

              {/* Tab sections */}
              <nav style={{ padding: '8px' }}>
                {sections.map((section, sIdx) => (
                  <div key={section.title}>
                    <div className={`flex items-center gap-2 px-3 ${sIdx === 0 ? 'pt-1 pb-2' : 'pt-4 pb-2'}`}>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[1.5px]">{section.title}</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="space-y-0.5">
                      {section.tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="w-full text-left relative rounded-lg transition-all duration-200 group"
                            style={{
                              padding: '10px 12px',
                              background: isActive ? (isPharma ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)') : 'transparent',
                              border: isActive ? (isPharma ? '1px solid #bfdbfe' : '1px solid #bbf7d0') : '1px solid transparent',
                            }}
                          >
                            {isActive && (
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                                style={{ height: 22, background: isPharma ? 'linear-gradient(180deg, #1d4ed8, #2563eb)' : 'linear-gradient(180deg, #2d6a4f, #40916c)' }}
                              />
                            )}

                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                style={{
                                  background: isActive ? (isPharma ? '#2563eb' : '#2d6a4f') : '#f1f5f9',
                                  boxShadow: isActive ? (isPharma ? '0 2px 8px rgba(37,99,235,0.25)' : '0 2px 8px rgba(45,106,79,0.25)') : 'none',
                                }}
                              >
                                <Icon
                                  size={15}
                                  className={`transition-colors duration-200 ${
                                    isActive ? 'text-white' : `text-slate-400 group-hover:${isPharma ? 'text-blue-600' : 'text-emerald-600'}`
                                  }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={`text-[12.5px] font-bold leading-none transition-colors duration-200 ${
                                  isActive ? (isPharma ? 'text-blue-900' : 'text-emerald-900') : 'text-slate-700 group-hover:text-slate-900'
                                }`}>
                                  {tab.label}
                                </p>
                                <p className={`text-[10px] mt-1 leading-none transition-colors duration-200 ${
                                  isActive ? (isPharma ? 'text-blue-600/70' : 'text-emerald-600/70') : 'text-slate-400'
                                }`}>
                                  {tab.desc}
                                </p>
                              </div>

                              <ChevronRight
                                size={13}
                                className={`flex-shrink-0 transition-all duration-200 ${
                                  isActive
                                    ? `${isPharma ? 'text-blue-600' : 'text-emerald-600'} opacity-100 translate-x-0`
                                    : 'text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {activeTab === 'info' && (
              <div className="card-pro" style={{ padding: 24 }}>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Profile Information</h2>
                <div className="flex items-center gap-5 mb-8">
                  {user?.logo ? (
                    <img src={user.logo.startsWith('http') ? user.logo : `${window.location.protocol}//${window.location.hostname}:5000${user.logo.startsWith('/') ? '' : '/'}${user.logo}`} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <div className={`h-20 w-20 rounded-xl ${isPharma ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'} text-white flex items-center justify-center font-bold text-2xl shadow-md`}>
                      {(user?.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">{user?.name}</h3>
                    <p className="text-sm text-slate-500 mb-1">{user?.email}</p>
                    <span className={`badge ${isPharma ? 'badge-blue' : 'badge-green'}`}>{user?.role?.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
