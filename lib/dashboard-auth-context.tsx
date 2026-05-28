'use client';

import { createContext, useContext } from 'react';

export interface DashboardAuthContextValue {
  isAuthenticated: boolean;
  showAuthSheet: () => void;
  markAuthenticated: () => void;
}

export const DashboardAuthContext = createContext<DashboardAuthContextValue>({
  isAuthenticated: false,
  showAuthSheet: () => {},
  markAuthenticated: () => {},
});

export function useDashboardAuth() {
  return useContext(DashboardAuthContext);
}
