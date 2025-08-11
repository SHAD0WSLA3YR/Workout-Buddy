
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { OnboardingData, WorkoutPlan, UserProfile, SessionLog } from '../types';
import { generateInitialWorkoutPlan as apiGeneratePlan, adjustWorkoutPlan as apiAdjustPlan } from '../services/geminiService';
import { useOnlineStatus } from './useOnlineStatus';

interface AppContextType {
  userProfile: UserProfile | null;
  workoutPlan: WorkoutPlan | null;
  sessionHistory: SessionLog[];
  isOnboardingComplete: boolean;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  adjustmentPending: boolean;
  generateInitialPlan: (data: OnboardingData) => Promise<void>;
  logSession: (session: SessionLog) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);
  const [workoutPlan, setWorkoutPlan] = useLocalStorage<WorkoutPlan | null>('workoutPlan', null);
  const [sessionHistory, setSessionHistory] = useLocalStorage<SessionLog[]>('sessionHistory', []);
  const [adjustmentPending, setAdjustmentPending] = useLocalStorage<boolean>('adjustmentPending', false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const isOnboardingComplete = useMemo(() => !!userProfile && !!workoutPlan, [userProfile, workoutPlan]);

  const generateInitialPlan = useCallback(async (data: OnboardingData) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = await apiGeneratePlan(data);
      setWorkoutPlan(plan);
      setUserProfile(data.userProfile);
    } catch (e) {
      setError('Failed to generate workout plan. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [setWorkoutPlan, setUserProfile]);

  const performApiAdjustment = useCallback(async () => {
    if (!workoutPlan || !userProfile) throw new Error("Missing data for adjustment");

    setIsLoading(true);
    setError(null);
    try {
        const recentSessions = sessionHistory.slice(-2);
        console.log("Calling Gemini to adjust workout plan...");
        const newPlan = await apiAdjustPlan(workoutPlan, recentSessions);
        setWorkoutPlan(newPlan);
        setAdjustmentPending(false); // It worked, clear the pending flag.
        console.log("Workout plan adjusted successfully.");
    } catch (e) {
        setError('Failed to adjust workout plan.');
        setAdjustmentPending(true); // It failed, keep it pending to retry.
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [workoutPlan, userProfile, sessionHistory, setWorkoutPlan, setIsLoading, setError, setAdjustmentPending]);

  useEffect(() => {
    if (isOnline && adjustmentPending) {
        console.log("Connection restored, attempting pending adjustment.");
        performApiAdjustment();
    }
  }, [isOnline, adjustmentPending, performApiAdjustment]);

  const logSession = useCallback((session: SessionLog) => {
    const updatedHistory = [...sessionHistory, session];
    setSessionHistory(updatedHistory);
    setWorkoutPlan(prevPlan => {
        if (!prevPlan) return null;
        const newWeeks = prevPlan.weeks.map(week => ({
            ...week,
            days: week.days.map(day => 
                day.id === session.id ? { ...day, isCompleted: true, rpe: session.rpe } : day
            )
        }));
        return { ...prevPlan, weeks: newWeeks };
    });

    const shouldCheckForAdjustment = updatedHistory.length > 0 && updatedHistory.length % 4 === 0;
    if (shouldCheckForAdjustment) {
        const recentSessions = updatedHistory.slice(-2);
        const shouldAdjust = recentSessions.every(s => (s.rpe || 10) <= 6);
        if (shouldAdjust) {
            console.log("Adjustment criteria met.");
            if (isOnline) {
                console.log("Online. Performing adjustment now.");
                performApiAdjustment();
            } else {
                console.log("Offline. Queuing adjustment for later.");
                setAdjustmentPending(true);
            }
        }
    }
  }, [sessionHistory, setSessionHistory, setWorkoutPlan, isOnline, setAdjustmentPending, performApiAdjustment]);

  const resetApp = useCallback(() => {
    setUserProfile(null);
    setWorkoutPlan(null);
    setSessionHistory([]);
    setAdjustmentPending(false);
  }, [setUserProfile, setWorkoutPlan, setSessionHistory, setAdjustmentPending]);

  const value = useMemo(() => ({
    userProfile,
    workoutPlan,
    sessionHistory,
    isOnboardingComplete,
    isLoading,
    error,
    isOnline,
    adjustmentPending,
    generateInitialPlan,
    logSession,
    resetApp
  }), [userProfile, workoutPlan, sessionHistory, isOnboardingComplete, isLoading, error, isOnline, adjustmentPending, generateInitialPlan, logSession, resetApp]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
