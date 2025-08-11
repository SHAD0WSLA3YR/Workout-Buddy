
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { WorkoutWeek } from '../types';
import { CheckCircleIcon, ArrowRightIcon } from '../components/icons/Icons';

const Dashboard: React.FC = () => {
    const { workoutPlan, adjustmentPending, isOnline } = useAppContext();
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!workoutPlan) return;
        // Find the first unfinished week to display
        const firstUnfinishedWeek = workoutPlan.weeks.findIndex(week => 
            week.days.some(day => !day.isCompleted)
        ) ?? 0;
        setCurrentWeekIndex(Math.max(0, firstUnfinishedWeek));
    }, [workoutPlan]);

    if (!workoutPlan) {
        return <div className="text-center text-dark-text-secondary">Loading workout plan...</div>;
    }

    const currentWeek: WorkoutWeek | undefined = workoutPlan.weeks[currentWeekIndex];

    const goToWorkout = (weekId: string, dayId: string) => {
        navigate(`/workout/${weekId}/${dayId}`);
    };

    return (
        <div className="space-y-6">
            {adjustmentPending && !isOnline && (
                <div className="p-4 rounded-lg text-sm flex items-center bg-amber-900/50 text-amber-200 border border-amber-700">
                    You are currently offline. Your workout plan will be adjusted by the AI coach once you reconnect.
                </div>
            )}
            {adjustmentPending && isOnline && (
                <div className="p-4 rounded-lg text-sm flex items-center bg-sky-900/50 text-sky-200 border border-sky-700">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>The AI Coach is updating your plan...</span>
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-dark-text-primary">Your Dashboard</h1>
                <p className="text-dark-text-secondary mt-1">Here's your plan for this week. Stay consistent!</p>
            </div>

            {/* Week Selector */}
            {workoutPlan.weeks.length > 1 && (
                <div className="flex items-center justify-center p-1 bg-dark-card rounded-lg space-x-1">
                    {workoutPlan.weeks.map((week, index) => (
                        <button
                            key={week.id}
                            onClick={() => setCurrentWeekIndex(index)}
                            className={`w-full py-2 px-4 text-sm font-semibold rounded-md transition-colors ${
                                currentWeekIndex === index
                                    ? 'bg-brand-primary text-white'
                                    : 'text-dark-text-secondary hover:bg-gray-600'
                            }`}
                        >
                            Week {week.week}
                        </button>
                    ))}
                </div>
            )}

            {/* Current Week's Plan */}
            {currentWeek ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">{`Week ${currentWeek.week}: ${currentWeek.description}`}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentWeek.days.map(day => (
                            <div key={day.id} className={`bg-dark-card p-5 rounded-lg shadow-lg flex flex-col justify-between transition-all duration-300 ${day.isCompleted ? 'opacity-60' : 'hover:shadow-brand-primary/20 hover:-translate-y-1'}`}>
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-dark-text-primary">{day.name}</h3>
                                        {day.isCompleted && (
                                            <div className="flex items-center text-xs text-brand-primary bg-emerald-900/50 px-2 py-1 rounded-full">
                                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                Done
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-dark-text-secondary mt-1">Day {day.day}</p>
                                    <ul className="mt-4 space-y-2 text-sm text-dark-text-secondary">
                                        {day.exercises.slice(0, 3).map(ex => (
                                            <li key={ex.id} className="flex items-center">
                                                <span className="font-medium text-dark-text-primary mr-2">{ex.name}</span>
                                                <span>{ex.sets} x {ex.reps ? `${ex.reps} reps` : `${ex.duration}s`}</span>
                                            </li>
                                        ))}
                                        {day.exercises.length > 3 && <li>...and more</li>}
                                    </ul>
                                </div>
                                <button
                                    onClick={() => !day.isCompleted && goToWorkout(currentWeek.id, day.id)}
                                    disabled={day.isCompleted}
                                    className="mt-6 w-full flex items-center justify-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {day.isCompleted ? 'Completed' : 'Start Workout'}
                                    {!day.isCompleted && <ArrowRightIcon className="w-5 h-5 ml-2" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p>No workout scheduled for this week.</p>
            )}
        </div>
    );
};

export default Dashboard;
