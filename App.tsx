
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './hooks/useAppContext';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import Performance from './pages/Performance';
import Profile from './pages/Profile';
import WorkoutSession from './pages/WorkoutSession';

const App: React.FC = () => {
  const { isOnboardingComplete } = useAppContext();

  if (!isOnboardingComplete) {
    return <Onboarding />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="performance" element={<Performance />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/workout/:weekId/:dayId" element={<WorkoutSession />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;