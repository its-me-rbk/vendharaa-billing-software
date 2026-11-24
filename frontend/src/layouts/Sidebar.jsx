import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Package, ShoppingCart, DollarSign, Users, Truck, BarChart3,
  Tag, Settings, LogOut, Clock, X, User, BookOpen, RotateCcw, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import greenLogo from '../assets/green_logo.png';
import blueLogo from '../assets/blue_logo.png';
import redLogo from '../assets/red_logo.png';

const adminNavItems = [
  { section: 'Main' },
  { title: 'Dashboard', icon: LayoutGrid, to: '/admin' },
  { title: 'Create Bill', icon: ShoppingCart, to: '/admin/billing' },
  { title: 'Invoices', icon: FileText, to: '/admin/invoices' },
  { section: 'Management' },
  { title: 'Products', icon: Package, to: '/admin/products' },
  { title: 'Customers', icon: Users, to: '/admin/customers' },
  { title: 'Suppliers', icon: Truck, to: '/admin/suppliers' },
  { section: 'Finance' },
  { title: 'Payments Due', icon: DollarSign, to: '/admin/payments' },
  { title: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { title: 'Accounts Ledger', icon: BookOpen, to: '/admin/ledger' },
  { section: 'System' },
  { title: 'Sessions', icon: Clock, to: '/admin/sessions' },
  { title: 'User Profile', icon: User, to: '/admin/profile' },
];

const cashierNavItems = [
  { section: 'Navigation' },
  { title: 'Dashboard', icon: LayoutGrid, to: '/cashier' },
  { title: 'Create Bill', icon: ShoppingCart, to: '/cashier/billing' },
  { title: 'Invoices', icon: FileText, to: '/cashier/invoices' },
  { title: 'Payments Due', icon: DollarSign, to: '/cashier/payments' },
  { section: 'System' },
  { title: 'User Profile', icon: User, to: '/cashier/profile' },
];

const superAdminNavItems = [
  { section: 'Global Overview' },
  { title: 'Consolidated Dashboard', icon: LayoutGrid, to: '/superadmin' },
  { title: 'Activity Logs', icon: Clock, to: '/superadmin/logs' },
  { section: 'Management' },
  { title: 'User Management', icon: Users, to: '/superadmin/users' },
  { title: 'Global Settings', icon: Settings, to: '/superadmin/settings' },
  { title: 'Manage Ledgers', icon: BookOpen, to: '/superadmin/ledger' },
];

export default function Sidebar({ variant = 'admin', mobileOpen = false, onClose }) {
  const { user, logout, businessType } = useAuth();
  const { pharmacyName, logoUrl, licenseNumber } = useApp();

  const baseNavItems = variant === 'cashier' ? cashierNavItems : variant === 'superadmin' ? superAdminNavItems : adminNavItems;

  let navItems = [...baseNavItems];
  if (variant === 'admin' && businessType === 'pharma') {
    const offersIndex = navItems.findIndex(item => item.title === 'Offers');
    if (offersIndex !== -1) {
      navItems.splice(offersIndex + 1, 0, { title: 'Return Bills', icon: RotateCcw, to: '/admin/returns' });
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : variant === 'cashier' ? 'CS' : variant === 'superadmin' ? 'SA' : 'AD';

  const basePath = variant === 'cashier' ? '/cashier' : variant === 'superadmin' ? '/superadmin' : '/admin';

  return (
    <aside className={`pro-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <NavLink to={basePath} className="sidebar-brand" style={{ textDecoration: 'none' }} onClick={onClose}>
        <div className="brand-icon" style={{ background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', border: 'none' }}>
          {variant === 'superadmin' ? (
            <img src={redLogo} alt="logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          ) : logoUrl ? (
            <img src={logoUrl} alt="logo" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
          ) : (
            <img src={businessType === 'pharma' ? blueLogo : greenLogo} alt="logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          )}
        </div>
        <div>
          <div className="brand-name">
            {variant === 'superadmin' ? 'Vendharaa Enterprise' : (pharmacyName || (businessType === 'pharma' ? 'PharmaMart' : 'AgroMart'))}
          </div>
          <div className="brand-tagline">
            {variant === 'superadmin' ? 'SuperAdmin Console' : (licenseNumber || (variant === 'cashier' ? 'Cashier Station' : 'Admin Panel'))}
          </div>
        </div>
        <button type="button" className="mobile-sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={16} />
        </button>
      </NavLink>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {navItems.map((item, idx) => {
          if (item.section) {
            return <div key={`section-${idx}`} className="nav-section-label">{item.section}</div>;
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === basePath}
              onClick={onClose}
              className={({ isActive }) => `pro-nav-link${isActive ? ' active' : ''}`}
            >
              <item.icon size={15} className="nav-icon" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User footer */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="user-name">{user?.name || (variant === 'cashier' ? 'Cashier' : 'Admin')}</div>
          <div className="user-role">{variant === 'cashier' ? 'Cashier' : 'Administrator'}</div>
        </div>
        <button className="sidebar-logout-btn" onClick={() => { logout(); onClose?.(); }} title="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
