import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Package, ShoppingCart, DollarSign, Users, Truck, BarChart3,
  Tag, Settings, LogOut, Leaf, Pill, Clock, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const adminNavItems = [
  { section: 'Main' },
  { title: 'Dashboard', icon: LayoutGrid, to: '/admin' },
  { title: 'Billing', icon: ShoppingCart, to: '/admin/billing' },
  { section: 'Management' },
  { title: 'Products', icon: Package, to: '/admin/products' },
  { title: 'Customers', icon: Users, to: '/admin/customers' },
  { title: 'Suppliers', icon: Truck, to: '/admin/suppliers' },
  { title: 'Offers', icon: Tag, to: '/admin/offers' },
  { section: 'Finance' },
  { title: 'Payments Due', icon: DollarSign, to: '/admin/payments' },
  { title: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { section: 'System' },
  { title: 'Sessions', icon: Clock, to: '/admin/sessions' },
  { title: 'Settings', icon: Settings, to: '/admin/settings' },
];

const cashierNavItems = [
  { section: 'Navigation' },
  { title: 'Dashboard', icon: LayoutGrid, to: '/cashier' },
  { title: 'Billing', icon: ShoppingCart, to: '/cashier/billing' },
  { title: 'Payments Due', icon: DollarSign, to: '/cashier/payments' },
];

export default function Sidebar({ variant = 'admin', mobileOpen = false, onClose }) {
  const { user, logout, businessType } = useAuth();
  const { pharmacyName, logoUrl, licenseNumber } = useApp();

  const navItems = variant === 'cashier' ? cashierNavItems : adminNavItems;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : variant === 'cashier' ? 'CS' : 'AD';

  const basePath = variant === 'cashier' ? '/cashier' : '/admin';

  return (
    <aside className={`pro-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <NavLink to={basePath} className="sidebar-brand" style={{ textDecoration: 'none' }} onClick={onClose}>
        <div className="brand-icon">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 4 }} />
          ) : (
            businessType === 'pharma' ? <Pill size={18} color="#fff" /> : <Leaf size={18} color="#fff" />
          )}
        </div>
        <div>
          <div className="brand-name">{pharmacyName || (businessType === 'pharma' ? 'PharmaMart' : 'AgroMart')}</div>
          <div className="brand-tagline">{licenseNumber || (variant === 'cashier' ? 'Cashier Station' : 'Admin Panel')}</div>
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
