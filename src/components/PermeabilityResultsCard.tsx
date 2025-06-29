import React from 'react'

interface PermeabilityResultsCardProps {
  results: Record<string, unknown>[];
}

const PermeabilityResultsCard: React.FC<PermeabilityResultsCardProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Permeability Results
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-zinc-100">Iteration</th>
              {Object.keys(results[0]).map((key) => (
                <th key={key} className="border px-2 py-1 bg-zinc-100 capitalize">{key.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr key={idx} className="even:bg-zinc-50">
                <td className="border px-2 py-1 font-mono text-xs text-center">{idx + 1}</td>
                {Object.keys(results[0]).map((key) => (
                  <td key={key} className="border px-2 py-1 font-mono text-xs text-right">{String(result[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermeabilityResultsCard;