
import React, { useState } from 'react';
import { OnboardingData, UserProfile, FitnessProfile, BaselineAssessment } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { ArrowLeftIcon, ArrowRightIcon } from './icons/Icons';
import Button from './Button';

const Onboarding: React.FC = () => {
  const { generateInitialPlan, isLoading } = useAppContext();
  const [step, setStep] = useState(1);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({ weight: 70, height: 175 });
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile>({ primaryGoal: 'strength', sessionsPerWeek: 3 });
  const [baseline, setBaseline] = useState<BaselineAssessment>({ maxPushups: 10, maxPlankDuration: 30, canPerformStandardPushup: true, hasEquipment: true });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const data: OnboardingData = { userProfile, fitnessProfile, baseline };
    await generateInitialPlan(data);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 data={userProfile} setData={setUserProfile} />;
      case 2:
        return <Step2 data={fitnessProfile} setData={setFitnessProfile} />;
      case 3:
        return <Step3 data={baseline} setData={setBaseline} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-dark-card rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Setup Your Profile</h1>
            <p className="text-dark-text-secondary mt-1">Step {step} of 3</p>
        </div>
        
        <div className="h-1 bg-dark-border rounded-full w-full">
            <div className="h-1 bg-brand-primary rounded-full transition-all duration-500" style={{width: `${(step/3)*100}%`}}></div>
        </div>

        {renderStep()}

        <div className="flex justify-between pt-4">
          <Button onClick={prevStep} disabled={step === 1 || isLoading} variant="secondary">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={nextStep} disabled={isLoading}>
              Next
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading}>
              {isLoading ? 'Generating Plan...' : 'Finish & Generate Plan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step Components defined outside to avoid re-renders
const Step1: React.FC<{ data: UserProfile; setData: React.Dispatch<React.SetStateAction<UserProfile>> }> = ({ data, setData }) => (
    <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold text-center">Your Profile</h2>
        <div>
            <label htmlFor="weight" className="block text-sm font-medium text-dark-text-secondary">Weight (kg)</label>
            <input type="number" id="weight" value={data.weight} onChange={e => setData(d => ({...d, weight: parseInt(e.target.value)}))} className="w-full mt-1 bg-gray-900 border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
        </div>
        <div>
            <label htmlFor="height" className="block text-sm font-medium text-dark-text-secondary">Height (cm)</label>
            <input type="number" id="height" value={data.height} onChange={e => setData(d => ({...d, height: parseInt(e.target.value)}))} className="w-full mt-1 bg-gray-900 border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
        </div>
    </div>
);

const Step2: React.FC<{ data: FitnessProfile; setData: React.Dispatch<React.SetStateAction<FitnessProfile>> }> = ({ data, setData }) => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-center">Fitness Goals</h2>
        <div>
            <label className="block text-sm font-medium text-dark-text-secondary">Primary Goal</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
                {(['strength', 'lean', 'endurance'] as const).map(goal => (
                    <button key={goal} onClick={() => setData(d => ({...d, primaryGoal: goal}))} className={`p-3 rounded-md text-sm capitalize transition-colors ${data.primaryGoal === goal ? 'bg-brand-primary text-white font-bold' : 'bg-gray-900 hover:bg-gray-700'}`}>
                        {goal}
                    </button>
                ))}
            </div>
        </div>
        <div>
            <label htmlFor="sessions" className="block text-sm font-medium text-dark-text-secondary">Sessions Per Week: {data.sessionsPerWeek}</label>
            <input type="range" id="sessions" min="2" max="5" value={data.sessionsPerWeek} onChange={e => setData(d => ({...d, sessionsPerWeek: parseInt(e.target.value)}))} className="w-full mt-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
        </div>
    </div>
);

const Step3: React.FC<{ data: BaselineAssessment; setData: React.Dispatch<React.SetStateAction<BaselineAssessment>> }> = ({ data, setData }) => (
    <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-semibold text-center">Baseline Assessment</h2>
        <div>
            <label htmlFor="maxPushups" className="block text-sm font-medium text-dark-text-secondary">Max Push-ups</label>
            <input type="number" id="maxPushups" value={data.maxPushups} onChange={e => setData(d => ({...d, maxPushups: parseInt(e.target.value)}))} className="w-full mt-1 bg-gray-900 border-dark-border rounded-md p-2" />
        </div>
        <div>
            <label htmlFor="maxPlank" className="block text-sm font-medium text-dark-text-secondary">Max Plank (seconds)</label>
            <input type="number" id="maxPlank" value={data.maxPlankDuration} onChange={e => setData(d => ({...d, maxPlankDuration: parseInt(e.target.value)}))} className="w-full mt-1 bg-gray-900 border-dark-border rounded-md p-2" />
        </div>
        <div className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
            <label htmlFor="canDoPushup" className="text-sm font-medium text-dark-text-secondary">Can you do a standard push-up?</label>
            <button
                id="canDoPushup"
                onClick={() => setData(d => ({...d, canPerformStandardPushup: !d.canPerformStandardPushup}))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.canPerformStandardPushup ? 'bg-brand-primary' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.canPerformStandardPushup ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
        <div className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
            <label htmlFor="hasEquipment" className="text-sm font-medium text-dark-text-secondary pr-4">Have equipment (e.g. pull-up bar)?</label>
            <button
                id="hasEquipment"
                onClick={() => setData(d => ({...d, hasEquipment: !d.hasEquipment}))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.hasEquipment ? 'bg-brand-primary' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasEquipment ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    </div>
);


export default Onboarding;