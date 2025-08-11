
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { WorkoutDay, Exercise } from '../types';
import Button from '../components/Button';
import { CheckCircleIcon } from '../components/icons/Icons';

const Countdown: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [count, setCount] = useState(3);
  
    useEffect(() => {
        if (count > 0) {
            try {
                const utterance = new SpeechSynthesisUtterance(count.toString());
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.error("Speech synthesis failed.", e);
            }
        }

        if (count === 0) {
            try {
                const utterance = new SpeechSynthesisUtterance('Go!');
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.error("Speech synthesis failed.", e);
            }
            onComplete();
            return;
        }

        const timer = setTimeout(() => setCount(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [count, onComplete]);
  
    return (
      <div className="absolute inset-0 bg-dark-bg/95 flex items-center justify-center z-50">
        <div key={count} className="text-9xl font-bold text-brand-primary animate-countdown-pop">{count > 0 ? count : ''}</div>
      </div>
    );
};

const CircularTimer: React.FC<{ duration: number; isRunning: boolean; onComplete: () => void; keyProp: string }> = ({ duration, isRunning, onComplete, keyProp }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = ((duration - timeLeft) / duration) * circumference;

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration, keyProp]);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) {
            if (timeLeft <= 0) onComplete();
            return;
        }
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onComplete]);

    return (
        <div className="relative w-52 h-52">
            <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} className="stroke-current text-dark-card" strokeWidth="15" fill="transparent" />
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    className="stroke-current text-brand-primary"
                    strokeWidth="15"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    transform="rotate(-90 100 100)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-dark-text-primary">
                {timeLeft}
            </div>
        </div>
    );
};

const RPEModal: React.FC<{ onSubmit: (rpe: number) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
    const [rpe, setRpe] = useState(7);
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-lg p-8 w-full max-w-sm text-center space-y-4">
                <h2 className="text-2xl font-bold">Session Complete!</h2>
                <p className="text-dark-text-secondary">Rate the perceived exertion (RPE) for this session. (1=Easy, 10=Max Effort)</p>
                <div className="text-4xl font-bold text-brand-primary">{rpe}</div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={rpe}
                    onChange={e => setRpe(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between text-xs text-dark-text-secondary">
                    <span>Easy</span>
                    <span>Max Effort</span>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button variant="secondary" onClick={onCancel} className="w-full">Skip</Button>
                    <Button onClick={() => onSubmit(rpe)} className="w-full">Submit</Button>
                </div>
            </div>
        </div>
    );
};

const WorkoutSession: React.FC = () => {
    const { weekId, dayId } = useParams<{ weekId: string, dayId: string }>();
    const navigate = useNavigate();
    const { workoutPlan, logSession } = useAppContext();

    const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [sessionState, setSessionState] = useState<'countdown' | 'exercise' | 'rest' | 'finished'>('countdown');
    const [showRPEModal, setShowRPEModal] = useState(false);

    useEffect(() => {
        const week = workoutPlan?.weeks.find(w => w.id === weekId);
        const day = week?.days.find(d => d.id === dayId);
        if (day) {
            setWorkoutDay(day);
        } else {
            navigate('/dashboard');
        }
    }, [weekId, dayId, workoutPlan, navigate]);

    const currentExercise: Exercise | null = workoutDay?.exercises[currentExerciseIndex] ?? null;

    const advanceToNext = useCallback(() => {
        if (!currentExercise || !workoutDay) return;

        if (currentSet < currentExercise.sets) {
            setCurrentSet(s => s + 1);
            setSessionState('rest');
        } else if (currentExerciseIndex < workoutDay.exercises.length - 1) {
            setCurrentExerciseIndex(i => i + 1);
            setCurrentSet(1);
            setSessionState('rest');
        } else {
            setSessionState('finished');
            setShowRPEModal(true);
        }
    }, [currentExercise, currentSet, currentExerciseIndex, workoutDay]);

    const handleSessionEnd = (rpe?: number) => {
        if (!workoutDay) return;
        const loggedSession = { ...workoutDay, date: new Date().toISOString(), isCompleted: true, rpe };
        logSession(loggedSession);
        navigate('/dashboard');
    };

    if (!workoutDay || !currentExercise) {
        return <div className="h-screen bg-dark-bg flex items-center justify-center text-white">Loading Workout...</div>;
    }

    const isTimedExercise = !!currentExercise.duration;
    
    return (
        <div className="min-h-screen bg-dark-bg text-dark-text-primary flex flex-col p-4 md:p-8 relative">
            {sessionState === 'countdown' && <Countdown onComplete={() => setSessionState('exercise')} />}
            {showRPEModal && <RPEModal onSubmit={handleSessionEnd} onCancel={() => handleSessionEnd(undefined)} />}

            <div className="flex-grow flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <p className="text-brand-primary font-semibold">
                        {sessionState === 'rest' ? 'REST' : `Set ${currentSet} of ${currentExercise.sets}`}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold">{currentExercise.name}</h1>
                </div>

                <div className="my-8">
                    {sessionState === 'exercise' && !isTimedExercise && (
                        <div className="flex flex-col items-center">
                            <p className="text-8xl font-bold">{currentExercise.reps}</p>
                            <p className="text-2xl text-dark-text-secondary">Reps</p>
                            <Button onClick={advanceToNext} className="mt-8">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                Mark as Done
                            </Button>
                        </div>
                    )}
                    {(sessionState === 'exercise' && isTimedExercise) && (
                        <CircularTimer
                            keyProp={`${currentExercise.id}-${currentSet}`}
                            duration={currentExercise.duration!}
                            isRunning={true}
                            onComplete={advanceToNext}
                        />
                    )}
                     {sessionState === 'rest' && (
                        <CircularTimer
                            keyProp={`rest-${currentExercise.id}-${currentSet}`}
                            duration={currentExercise.rest}
                            isRunning={true}
                            onComplete={() => setSessionState('exercise')}
                        />
                    )}
                </div>

                <div className="bg-dark-card p-4 rounded-lg w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-2">Next Up</h3>
                    {currentSet < currentExercise.sets ?
                        <p className="text-dark-text-secondary">Set {currentSet + 1}: {currentExercise.name}</p> :
                        workoutDay.exercises[currentExerciseIndex + 1] ?
                        <p className="text-dark-text-secondary">{workoutDay.exercises[currentExerciseIndex + 1].name}</p> :
                        <p className="text-dark-text-secondary">Final exercise!</p>
                    }
                </div>
            </div>
            <div className="flex-shrink-0 mt-8 flex justify-center">
                <Button variant="danger" onClick={() => navigate('/dashboard')}>End Workout</Button>
            </div>
        </div>
    );
};

export default WorkoutSession;