/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingPage from './components/LandingPage';
import DashboardDemo from './components/DashboardDemo';

export interface UserSession {
  email: string;
  name: string;
  agencyName?: string;
  planId: string;
  selectedAddons: string[];
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [activeModules, setActiveModules] = useState<string[]>(['financeiro', 'fluxo_caixa', 'calculadora_roi', 'agenda']);
  const [planId, setPlanId] = useState<string>('pro');
  const [initialWorkspaceId, setInitialWorkspaceId] = useState<string | null>(null);

  // Load registered session on app mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("agencyos_user_session");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setPlanId(parsed.planId);
        setActiveModules(parsed.selectedAddons || ['financeiro', 'fluxo_caixa', 'calculadora_roi', 'agenda']);
        
        const savedWs = localStorage.getItem("agencyos_active_workspace");
        if (savedWs) {
          setInitialWorkspaceId(savedWs);
        }
        setView('workspace');
      }
    } catch (e) {
      console.error("Failed to load local user session:", e);
    }
  }, []);

  // Set logged in session
  const handleLoginSuccess = (loggedInUser: UserSession, defaultWorkspaceId?: string) => {
    setUser(loggedInUser);
    setPlanId(loggedInUser.planId);
    setActiveModules(loggedInUser.selectedAddons || ['financeiro', 'fluxo_caixa', 'calculadora_roi', 'agenda']);
    localStorage.setItem("agencyos_user_session", JSON.stringify(loggedInUser));
    if (defaultWorkspaceId) {
      setInitialWorkspaceId(defaultWorkspaceId);
      localStorage.setItem("agencyos_active_workspace", defaultWorkspaceId);
    }
    setView('workspace');
  };

  // Log out session
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("agencyos_user_session");
    localStorage.removeItem("agencyos_active_workspace");
    setView('landing');
  };

  // Quick Trial Access directly from Hero CTA
  const handleEnterWorkspaceTrial = (addons: string[], selectedPlan: string) => {
    // Generate a beautiful instant trial profile for testing immediately
    const trialUser: UserSession = {
      email: "trial_" + Math.random().toString(36).substring(2, 7) + "@demo.com",
      name: "Visitante Demonstrativo",
      agencyName: "Demonstração AgencyOS",
      planId: selectedPlan,
      selectedAddons: addons
    };
    handleLoginSuccess(trialUser);
  };

  return (
    <div className="bg-[#030712] min-h-screen text-gray-100 flex flex-col font-sans" id="app_root">
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing_view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <LandingPage 
              onEnterSystem={handleEnterWorkspaceTrial} 
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workspace_view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <DashboardDemo 
              initialActiveModules={activeModules}
              initialPlanId={planId}
              onExit={handleLogout}
              user={user}
              initialWorkspaceId={initialWorkspaceId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
