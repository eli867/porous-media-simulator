'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';

// Using Unicode symbols instead of react-icons since they're not available
const commands = [
  {
    os: 'Windows',
    icon: <FaWindows className="text-white" size={24} />,
    description: 'Use this command in Command Prompt or PowerShell.',
    command: `curl.exe -X POST -F "image=@/path/to/your_image.png" -F "density=1000" -F "viscosity=0.001" -F "domain_width=1.0" -F "mesh_amp=1" -F "max_iter=10000" -F "convergence_rms=0.000001" -F "n_cores=4" https://porous-media-predictor-production.up.railway.app/simulate`,
  },
  {
    os: 'macOS & Linux',
    icon: (
      <span className="flex items-center gap-1 mr-1">
        <FaApple className="text-white" size={27} />
        <FaLinux className="text-white" size={24} />
      </span>
    ),
    description: 'Use this command in Terminal or your shell.',
    command: `curl -X POST -F "image=@/path/to/your_image.png" -F "density=1000" -F "viscosity=0.001" -F "domain_width=1.0" -F "mesh_amp=1" -F "max_iter=10000" -F "convergence_rms=0.000001" -F "n_cores=4" https://porous-media-predictor-production.up.railway.app/simulate`,
  },
];

// Intersection Observer hook
function useInView(options: IntersectionObserverInit = {}): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Only trigger once
        }
      },
      options
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [options]);

  return [ref, inView];
}

const CommandsSection = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sectionRef, inView] = useInView({ threshold: 0.2 });
  const mounted = inView;

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
    <div ref={sectionRef} className="flex flex-col items-center justify-center min-h-[60vh] py-12 bg-gradient-to-br from-blue-950/10 via-indigo-950/5 to-purple-950/10 rounded-3xl px-4">
      <p className="text-xl text-center mb-8 text-gray-300 max-w-2xl">
        Use the following <span className="font-mono font-semibold text-white">curl</span> commands to submit your porous media image and simulation parameters directly to our API from your terminal.
      </p>
      <div className="flex flex-col lg:flex-row gap-6 mt-4 w-full justify-center items-stretch max-w-5xl px-4">
        {commands.map((cmd, i) => (
          <div
            key={cmd.os}
            className={`w-full max-w-md flex-1 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <Card className="h-full flex flex-col backdrop-blur-2xl bg-black/15 border border-white/10 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 pt-5">
                <CardTitle className="text-xl font-semibold flex items-center justify-center gap-3 text-white">
                  <span className="text-2xl leading-none flex items-center justify-center w-8 h-8">
                    {cmd.icon}
                  </span>
                  <span className="leading-none">{cmd.os}</span>
                </CardTitle>
                <CardDescription className="text-sm text-center opacity-80 mt-2 text-gray-300">
                  {cmd.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col px-5 pb-5">
                <div className="flex-1 flex flex-col justify-end">
                  <div className="relative">
                    {/* Copy button positioned above the code block */}
                    <div className="flex justify-end mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(cmd.command, i)}
                        className="h-8 px-3 text-xs backdrop-blur-xl bg-black/30 border-white/20 hover:bg-black/40 transition-all duration-300 rounded-lg shadow-lg text-gray-100"
                        aria-label={`Copy curl command for ${cmd.os}`}
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="w-3 h-3 mr-1 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    {/* Code block - made thinner */}
                    <div className="backdrop-blur-xl bg-black/25 rounded-xl p-4 font-mono text-sm overflow-x-auto border border-white/10 shadow-inner h-[160px] flex items-center">
                      <pre className="whitespace-pre-wrap break-all select-all text-xs leading-relaxed w-full text-gray-200">
                        {cmd.command}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {/* Usage instructions */}
      <div className="mt-8 w-full text-center backdrop-blur-lg bg-black/10 rounded-2xl p-6 border border-white/10 shadow-xl">
        <p className="text-sm opacity-80 leading-relaxed text-gray-300">
          Replace the image path with your actual file path and replace the parameters with your desired values.
        </p>
      </div>
    </div>
  );
};

export default CommandsSection;