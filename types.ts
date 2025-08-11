
export interface UserProfile {
  weight: number;
  height: number;
}

export type FitnessGoal = 'strength' | 'lean' | 'endurance';

export interface FitnessProfile {
  primaryGoal: FitnessGoal;
  sessionsPerWeek: number;
}

export interface BaselineAssessment {
  maxPushups: number;
  maxPlankDuration: number;
  canPerformStandardPushup: boolean;
  hasEquipment: boolean;
}

export interface OnboardingData {
  userProfile: UserProfile;
  fitnessProfile: FitnessProfile;
  baseline: BaselineAssessment;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: number;
  duration?: number; // in seconds
  rest: number; // in seconds
}

export interface WorkoutDay {
  id: string;
  day: number;
  name: string;
  exercises: Exercise[];
  isCompleted: boolean;
  rpe?: number;
}

export interface WorkoutWeek {
  id: string;
  week: number;
  description: string;
  days: WorkoutDay[];
}

export interface WorkoutPlan {
  id: string;
  weeks: WorkoutWeek[];
}

export interface SessionLog extends WorkoutDay {
  date: string; // ISO string
}