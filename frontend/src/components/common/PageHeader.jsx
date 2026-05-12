import React from 'react';

export default function PageHeader({ title, subtitle, breadcrumbs, children }) {
  return (
    <div className="top-bar">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="breadcrumb">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="separator">›</span>}
                {bc.href ? (
                  <a href={bc.href}>{bc.label}</a>
                ) : (
                  <span className="current">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {children && <div className="top-bar-actions">{children}</div>}
    </div>
  );
}
