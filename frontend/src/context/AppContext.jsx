import React, { createContext, useContext, useState, useEffect } from 'react';
import settingsService from '../services/settingsService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [pharmacyName, setPharmacyName] = useState('Vendharaa Platform');
  const [logoUrl, setLogoUrl] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await settingsService.getPublic();
        if (!mounted) return;
        if (res.data?.success && res.data.data) {
          const s = res.data.data;
          if (s.pharmacyName) setPharmacyName(s.pharmacyName);
          if (s.logo) setLogoUrl(s.logo);
          if (s.licenseNumber) setLicenseNumber(s.licenseNumber);
          setSettings(s);
        }
      } catch (_) {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Update favicon when logo changes
  useEffect(() => {
    if (!logoUrl) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = logoUrl;
  }, [logoUrl]);

  const refreshSettings = async () => {
    try {
      const res = await settingsService.getPublic();
      if (res.data?.success && res.data.data) {
        const s = res.data.data;
        if (s.pharmacyName) setPharmacyName(s.pharmacyName);
        if (s.logo) setLogoUrl(s.logo);
        if (s.licenseNumber) setLicenseNumber(s.licenseNumber);
        setSettings(s);
      }
    } catch (_) {}
  };

  return (
    <AppContext.Provider value={{
      pharmacyName, logoUrl, licenseNumber, settings,
      loading, refreshSettings,
      setPharmacyName, setLogoUrl, setLicenseNumber,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
