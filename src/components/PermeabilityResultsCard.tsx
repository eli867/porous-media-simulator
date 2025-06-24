import React from 'react'

interface PermeabilityResultsCardProps {
  results: Record<string, unknown>[];
}

const PermeabilityResultsCard: React.FC<PermeabilityResultsCardProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  const firstResult = results[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Permeability Results
      </h3>
      <div className="space-y-2">
        {Object.entries(firstResult).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="text-gray-900 dark:text-white font-mono">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermeabilityResultsCard;