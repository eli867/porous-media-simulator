'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';

// Using Unicode symbols instead of react-icons since they're not available
const commands = [
  {
    os: 'Windows',
    icon: <FaWindows className="text-zinc-700" size={22} />,
    command: `curl.exe -X POST -F "image=@/path/to/your_image.png" -F "density=1000" -F "viscosity=0.001" -F "domain_width=1.0" -F "mesh_amp=1" -F "max_iter=10000" -F "convergence_rms=0.000001" -F "n_cores=4" https://porous-media-predictor-production.up.railway.app/simulate`,
  },
  {
    os: 'macOS & Linux',
    icon: (
      <span className="flex items-center gap-1 mr-1">
        <FaApple className="text-zinc-700" size={22} />
        <FaLinux className="text-zinc-700" size={20} />
      </span>
    ),
    command: `curl -X POST -F "image=@/path/to/your_image.png" -F "density=1000" -F "viscosity=0.001" -F "domain_width=1.0" -F "mesh_amp=1" -F "max_iter=10000" -F "convergence_rms=0.000001" -F "n_cores=4" https://porous-media-predictor-production.up.railway.app/simulate`,
  },
];

const CommandsSection = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (command: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto py-12 px-4 bg-white rounded-xl border border-zinc-200 shadow-lg">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2 text-center">Reproducible API Access</h1>
        <p className="text-lg text-zinc-700 text-center max-w-2xl mx-auto">
          Use the following <span className="font-mono font-semibold text-zinc-900">curl</span> commands to submit your porous media image and simulation parameters directly to our API. This enables reproducible, automated workflows for scientific research and publication.
        </p>
      </header>
      <div className="divide-y divide-zinc-200 bg-zinc-50 rounded-lg border border-zinc-100">
        {commands.map((cmd, i) => (
          <div key={cmd.os} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-6">
            <div className="flex items-center gap-3 min-w-[140px]">
              <span>{cmd.icon}</span>
              <span className="text-base font-medium text-zinc-800">{cmd.os}</span>
            </div>
            <div className="flex-1 w-full max-w-full">
              <div className="relative flex items-center gap-2">
                <pre className="font-mono text-sm text-zinc-900 bg-zinc-100 rounded-md p-3 border border-zinc-200 overflow-x-auto whitespace-pre-wrap break-all w-full select-all">
                  {cmd.command}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(cmd.command, i)}
                  className="ml-2 px-2 py-1 text-xs border-zinc-300 bg-white hover:bg-zinc-100 transition"
                  aria-label={`Copy curl command for ${cmd.os}`}
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-emerald-500" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-zinc-700 text-base text-center bg-zinc-50 rounded-lg border border-zinc-100 p-6">
        <strong>Instructions:</strong> Replace <span className="font-mono text-zinc-900">/path/to/your_image.png</span> with your actual file path and adjust the parameters as needed for your experiment. For details, see the <a href="https://porous-media-predictor-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">API documentation</a>.
      </div>
      <footer className="mt-10 pt-6 border-t border-zinc-200 text-center text-zinc-500 text-xs">
        <div>
          <span className="font-semibold">How to cite:</span> If you use this tool in your research, please cite our API and this software. <br />
          <span className="italic">"Fluid Permeability Simulator, 2024. https://porous-media-predictor-production.up.railway.app"</span>
        </div>
      </footer>
    </section>
  );
};

export default CommandsSection;