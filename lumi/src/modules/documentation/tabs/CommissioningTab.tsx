import React from 'react';
import { CommissioningChecklist } from '../components/CommissioningChecklist';

export const CommissioningTab: React.FC = () => {
    return (
        <div className="h-full">
            <CommissioningChecklist />
        </div>
    );
};
