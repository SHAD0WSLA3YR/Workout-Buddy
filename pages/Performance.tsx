
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { SessionLog } from '../types';

const Performance: React.FC = () => {
    const { sessionHistory } = useAppContext();

    const volumeData = sessionHistory.map((log: SessionLog, index) => {
        const totalVolume = log.exercises.reduce((acc, ex) => {
            return acc + (ex.sets * (ex.reps || ex.duration || 0));
        }, 0);
        return {
            name: `S${index + 1}`,
            volume: totalVolume,
            date: new Date(log.date).toLocaleDateString(),
        };
    });

    const rpeData = sessionHistory
        .filter(log => log.rpe)
        .map((log: SessionLog, index) => ({
            name: `S${index + 1}`,
            RPE: log.rpe,
            date: new Date(log.date).toLocaleDateString(),
        }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-dark-card p-2 border border-dark-border rounded-md shadow-lg">
              <p className="label font-bold text-dark-text-primary">{`${payload[0].payload.date}`}</p>
              <p className="intro text-sm text-dark-text-secondary">{`Session: ${label}`}</p>
              <p className="desc text-brand-primary">{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
          );
        }
        return null;
    };

    if (sessionHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-2xl font-bold text-dark-text-primary">No Performance Data Yet</h1>
                <p className="text-dark-text-secondary mt-2">Complete a workout session to see your progress here.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-dark-text-primary">Your Performance</h1>
                <p className="text-dark-text-secondary mt-1">Track your progress over time.</p>
            </div>

            <div className="bg-dark-card p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-dark-text-primary">Total Workout Volume</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={volumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#37415180'}} />
                        <Legend />
                        <Bar dataKey="volume" fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-dark-card p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-dark-text-primary">RPE Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={rpeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" domain={[1, 10]}/>
                        <Tooltip content={<CustomTooltip />} cursor={{stroke: '#37415180', strokeWidth: 2}}/>
                        <Legend />
                        <Line type="monotone" dataKey="RPE" stroke="#0EA5E9" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Performance;
