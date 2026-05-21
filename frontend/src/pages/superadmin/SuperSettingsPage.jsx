import React, { useState } from 'react';
import { Settings as SettingsIcon, DollarSign, Printer, ChevronRight, Save, LayoutGrid } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import GeneralSettings from '../admin/settings/GeneralSettings';
import PrintSettings from '../admin/settings/PrintSettings';

function Toggle({ checked, onChange, isPharma }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? (isPharma ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SuperSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedUnit, setSelectedUnit] = useState('agro');
  const isPharma = selectedUnit === 'pharma';

  const sections = [
    {
      title: 'Store Settings',
      tabs: [
        { id: 'general', label: 'General', desc: 'Business info & branding', icon: SettingsIcon },
        { id: 'tax', label: 'Tax & GST', desc: 'Tax rates & compliance', icon: DollarSign },
        { id: 'print', label: 'Print & Output', desc: 'Invoice layout & paper', icon: Printer },
      ],
    },
  ];

  return (
    <div>
      <PageHeader 
        title="Global Configuration" 
        subtitle="Manage settings for all business units"
        breadcrumbs={[{ label: 'Home', href: '/superadmin' }, { label: 'Settings' }]}
      >
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedUnit('agro')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${selectedUnit === 'agro' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Agro Mart
          </button>
          <button
            onClick={() => setSelectedUnit('pharma')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${selectedUnit === 'pharma' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pharma Care
          </button>
        </div>
      </PageHeader>

      <div className="page-content">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar Navigation ── */}
          <div className="w-full lg:w-[272px] flex-shrink-0">
            <div className="card-pro overflow-hidden" style={{ padding: 0 }}>
              {/* Sidebar header */}
              <div style={{ padding: '18px 20px 14px' }} className="border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md ${isPharma ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'} flex items-center justify-center shadow-sm`}>
                    <LayoutGrid size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider leading-none">System Settings</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Editing: <span className={`font-bold ${isPharma ? 'text-blue-600' : 'text-emerald-600'}`}>{selectedUnit.toUpperCase()}</span></p>
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
            {/* The GeneralSettings component will remount or fetch new data when businessType prop changes */}
            {activeTab === 'general' && <GeneralSettings key={`general-${selectedUnit}`} businessType={selectedUnit} />}
            
            {activeTab === 'tax' && (
              <div className="card-pro" style={{ padding: 24 }}>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Taxation Engine</h2>
                    <p className="text-[11px] text-slate-500">Configure global GST and VAT parameters</p>
                  </div>
                  <div className={`p-3 ${isPharma ? 'bg-blue-50' : 'bg-emerald-50'} rounded-xl`}><DollarSign className={isPharma ? "text-blue-600" : "text-emerald-600"} size={24} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div><label className="pro-label">Default GST Rate (%)</label><input className="pro-input" type="number" defaultValue={18} /></div>
                  <div><label className="pro-label">CGST Allocation (%)</label><input className="pro-input" type="number" defaultValue={9} /></div>
                  <div><label className="pro-label">SGST Allocation (%)</label><input className="pro-input" type="number" defaultValue={9} /></div>
                  <div><label className="pro-label">IGST Rate (%)</label><input className="pro-input" type="number" defaultValue={18} /></div>
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
                    <div><p className="text-sm font-bold text-slate-800">Universal GST Enforcement</p><p className="text-[11px] text-slate-500 mt-0.5">Apply default rates to all line items</p></div>
                    <Toggle checked={true} onChange={() => {}} isPharma={isPharma} />
                  </div>
                  <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:${isPharma ? 'border-blue-200' : 'border-emerald-200'}`}>
                    <div><p className="text-sm font-bold text-slate-800">Invoice Tax Transparency</p><p className="text-[11px] text-slate-500 mt-0.5">Show CGST/SGST breakdown on bills</p></div>
                    <Toggle checked={true} onChange={() => {}} isPharma={isPharma} />
                  </div>
                </div>
                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                  <button className={`px-5 py-2.5 ${isPharma ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors`}>
                    <Save size={15} /> Update Configurations
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'print' && <PrintSettings businessType={selectedUnit} />}
          </div>
        </div>
      </div>
    </div>
  );
}
