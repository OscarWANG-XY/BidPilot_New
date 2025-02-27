// PhaseIndicator.tsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PhaseIndicatorProps } from '@/playground/ProjectManagement/types';

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phases, currentPhaseId }) => {
  return (
    <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
      {phases.map((phase, index) => (
        <React.Fragment key={phase.id}>
          <div className={`flex flex-col items-center ${phase.id === currentPhaseId ? 'text-blue-600 font-medium' : phase.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 ${phase.id === currentPhaseId ? 'bg-blue-100 border-2 border-blue-600' : phase.status === 'completed' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-400'}`}>
              {phase.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="text-xs whitespace-nowrap">{phase.name}</span>
          </div>
          {index < phases.length - 1 && (
            <div className={`w-16 h-px mt-4 ${index < phases.findIndex(p => p.id === currentPhaseId) ? 'bg-green-600' : 'bg-gray-300'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default PhaseIndicator;