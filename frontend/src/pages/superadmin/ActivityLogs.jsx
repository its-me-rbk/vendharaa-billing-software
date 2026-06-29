import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, Shield, User, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import superAdminService from '../../services/superAdminService';
import PageHeader from '../../components/common/PageHeader';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ businessType: 'all', method: '' });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getLogs({ page, ...filters });
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="System Activity Logs" 
        subtitle="Complete audit trail of all administrative actions"
        breadcrumbs={[{ label: 'Home', href: '/superadmin' }, { label: 'Activity Logs' }]}
      >
        <div className="flex gap-2">
          <select 
            className="pro-input !w-auto !py-1.5"
            value={filters.businessType}
            onChange={e => { setFilters({...filters, businessType: e.target.value}); setPage(1); }}
          >
            <option value="all">All Units</option>
            <option value="agro">Agro Unit</option>
            <option value="pharma">Pharma Unit</option>
            <option value="master">Master Unit</option>
          </select>
          <select 
            className="pro-input !w-auto !py-1.5"
            value={filters.method}
            onChange={e => { setFilters({...filters, method: e.target.value}); setPage(1); }}
          >
            <option value="">All Actions</option>
            <option value="POST">Created</option>
            <option value="PUT">Updated</option>
            <option value="DELETE">Deleted</option>
          </select>
        </div>
      </PageHeader>

      <div className="page-content">
        <div className="card-pro overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50" style={{ padding: '20px 24px' }}>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Audit Trail</h3>
            <p className="text-[11px] text-slate-500">Chronological list of system modifications</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Unit</th>
                  <th>Endpoint</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving Logs...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-16 text-slate-400 italic">No activity recorded for this period</td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-black">
                          {log.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{log.user.name}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{log.user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[250px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">
                          {log.description || log.action}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            log.method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
                            log.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                            log.method === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.method === 'POST' ? 'CREATED' : log.method === 'PUT' ? 'UPDATED' : log.method === 'DELETE' ? 'DELETED' : log.method}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{log.action}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{log.businessType}</span>
                    </td>
                    <td className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                      {log.endpoint}
                    </td>
                    <td className="text-[11px] text-slate-400 font-medium">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="action-btn !w-8 !h-8 border border-slate-200 bg-white disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="action-btn !w-8 !h-8 border border-slate-200 bg-white disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
