
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Button from '../components/Button';

const Profile: React.FC = () => {
    const { userProfile, resetApp } = useAppContext();

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all your data? This action cannot be undone.")) {
            resetApp();
            // The app will automatically navigate to onboarding
        }
    };
    
    if (!userProfile) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-dark-text-primary">Your Profile</h1>
                <p className="text-dark-text-secondary mt-1">Your personal and fitness information.</p>
            </div>

            <div className="bg-dark-card p-6 rounded-lg shadow-lg">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-dark-text-secondary">Weight</span>
                        <span className="font-semibold text-dark-text-primary">{userProfile.weight} kg</span>
                    </div>
                    <div className="border-t border-dark-border"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-dark-text-secondary">Height</span>
                        <span className="font-semibold text-dark-text-primary">{userProfile.height} cm</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-dark-card p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-dark-text-primary mb-4">Settings</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-md font-medium text-dark-text-primary">Reset Application</h3>
                        <p className="text-sm text-dark-text-secondary mt-1">
                            This will erase all your workout data, history, and profile information. You will be taken back to the onboarding process.
                        </p>
                    </div>
                    <div className="text-right">
                        <Button variant="danger" onClick={handleReset}>
                            Reset All Data
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
