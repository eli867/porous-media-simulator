import { useState, useEffect } from "react";
import { motion, MotionValue } from "framer-motion";

interface ComputerComponentProps {
  y: MotionValue<string>;
  isCovered: boolean;
  onContinue: () => void;
}

const lines = [
  "Welcome to the Permeability Simulator!",
  "",
  "To begin, upload an image of your porous medium.",
  "The image should be black and white, where white is fluid and black is solid.",
  "There must be at least one clear channel of black from left to right.",
  "Recommended size: at least 128x128 pixels."
];

const TYPING_SPEED = 35;
const LINE_PAUSE = 350;

// Default values (should match APP_CONFIG.DEFAULT_PARAMS from dashboard)
const defaultParams = {
  density: 1000,
  viscosity: 0.001,
  domain_width: 1.0,
  mesh_amp: 1,
  max_iter: 10000,
  convergence_rms: 0.00001,
  n_cores: 4,
};

const parameterInstructions = [
  "Now choose your simulation parameters:",
  "- Density (kg/m³): The density of the medium.",
  "- Viscosity (Pa·s): The viscosity of the medium.",
  "- Domain Width (m): The width of the simulation domain.",
  "- Mesh Amplification: Controls mesh refinement.",
  "- Max Iterations: Maximum number of solver iterations.",
  "- Convergence RMS: Residual threshold for convergence.",
  "- CPU Cores: Number of CPU cores to use."
];

const ComputerComponent = ({ y, isCovered, onContinue }: ComputerComponentProps) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([""]);
  const [readyToType, setReadyToType] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);
  const [showParamInstructions, setShowParamInstructions] = useState(false);
  const [params, setParams] = useState({ ...defaultParams });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  // Secret shortcut to skip animations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+S to skip animations
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setDisplayedLines(lines);
        setShowUpload(true);
        setReadyToType(false); // Stop the typing animation
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!readyToType) return;
    let currentLine = 0;
    let currentChar = 0;
    let typingTimeout: NodeJS.Timeout | null = null;
    let pauseTimeout: NodeJS.Timeout | null = null;

    setDisplayedLines([""]);
    setShowUpload(false);
    setShowParamInstructions(false);
    setImageSelected(false);

    const typeLine = () => {
      if (currentLine >= lines.length) {
        setTimeout(() => setShowUpload(true), 400);
        return;
      }
      if (currentChar <= lines[currentLine].length) {
        setDisplayedLines((prev) => {
          const newLines = [...prev];
          newLines[currentLine] = lines[currentLine].slice(0, currentChar);
          return newLines;
        });
        currentChar++;
        typingTimeout = setTimeout(typeLine, TYPING_SPEED);
      } else {
        pauseTimeout = setTimeout(() => {
          currentLine++;
          currentChar = 0;
          if (currentLine < lines.length) {
            setDisplayedLines((prev) => [...prev, ""]);
            typeLine();
          } else {
            setTimeout(() => setShowUpload(true), 400);
          }
        }, LINE_PAUSE);
      }
    };

    typeLine();
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [readyToType]);

  // Animate parameter instructions after image is selected
  useEffect(() => {
    if (imageSelected) {
      setTimeout(() => setShowParamInstructions(true), 400);
    }
  }, [imageSelected]);

  // Allow continue after result is shown
  useEffect(() => {
    if (result) {
      setCanContinue(true);
    }
  }, [result]);

  // Add this useEffect after other useEffects
  useEffect(() => {
    if (isCovered) {
      setReadyToType(true);
    } else {
      setReadyToType(false);
    }
  }, [isCovered]);

  // Handler for file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageSelected(true);
    }
  };

  // Handler for parameter input changes
  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handler for form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsProcessing(true);
    try {
      // Find the file from the file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        setError('Please select an image file first.');
        setIsProcessing(false);
        return;
      }
      const formData = new FormData();
      formData.append('image', file);
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      const response = await fetch('/api/simulate', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorJson = await response.json();
        setError(errorJson.error || 'Simulation failed');
        setIsProcessing(false);
        return;
      }
      const data = await response.json();
      setResult(data);
    } catch {
      setError('Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
  <motion.div
    style={{ y }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-3xl border-8 border-zinc-800 bg-black z-30 shadow-2xl flex flex-col font-mono overflow-hidden"
    initial={{ filter: "blur(0px)" }}
    animate={{ filter: isCovered ? "blur(0px)" : "blur(0px)" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
      <div className="w-full bg-zinc-900 border-b border-zinc-700 rounded-t-2xl px-4 py-2 flex items-center gap-2" style={{ minHeight: '2.5rem' }}>
        <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
        <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span>
        <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
        <span className="ml-4 text-zinc-400 text-xs">permeability-simulator@user:~</span>
      </div>
      <div className="flex-1 w-full bg-black rounded-b-2xl px-4 py-8 text-green-400 text-lg overflow-y-auto">
        {displayedLines.map((line, idx) => (
          <div key={idx} className="min-h-[1.5em]">
            {line.length > 0 ? <span>&gt; </span> : null}
            <span>{line}</span>
            {lines[idx] && idx === displayedLines.length - 1 && line.length < lines[idx].length ? <span className="animate-pulse">|</span> : null}
          </div>
        ))}
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-col items-start gap-4"
          >
            <label className="text-green-300 text-base" htmlFor="image-upload">
              Select your image:
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="bg-zinc-800 text-green-200 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              onChange={handleFileChange}
            />
          </motion.div>
        )}
        {showParamInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-col items-start gap-2"
          >
            {parameterInstructions.map((text, idx) => (
              <div key={idx} className="text-green-300 text-base">
                {text}
              </div>
            ))}
            {/* Parameter input form */}
            <form className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="density">Density (kg/m³)</label>
                <input
                  id="density"
                  type="number"
                  step="0.1"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.density.toString()}
                  value={params.density}
                  onChange={e => handleParamChange('density', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="viscosity">Viscosity (Pa·s)</label>
                <input
                  id="viscosity"
                  type="number"
                  step="0.0001"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.viscosity.toString()}
                  value={params.viscosity}
                  onChange={e => handleParamChange('viscosity', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="domain_width">Domain Width (m)</label>
                <input
                  id="domain_width"
                  type="number"
                  step="0.1"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.domain_width.toString()}
                  value={params.domain_width}
                  onChange={e => handleParamChange('domain_width', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="mesh_amp">Mesh Amplification</label>
                <input
                  id="mesh_amp"
                  type="number"
                  min="1"
                  max="10"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.mesh_amp.toString()}
                  value={params.mesh_amp}
                  onChange={e => handleParamChange('mesh_amp', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="max_iter">Max Iterations</label>
                <input
                  id="max_iter"
                  type="number"
                  min="1000"
                  max="100000"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.max_iter.toString()}
                  value={params.max_iter}
                  onChange={e => handleParamChange('max_iter', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="convergence_rms">Convergence RMS</label>
                <input
                  id="convergence_rms"
                  type="number"
                  step="0.000001"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.convergence_rms.toString()}
                  value={params.convergence_rms}
                  onChange={e => handleParamChange('convergence_rms', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-green-200 text-sm mb-1" htmlFor="n_cores">CPU Cores</label>
                <input
                  id="n_cores"
                  type="number"
                  min="1"
                  max="32"
                  className="w-full bg-zinc-800 text-green-100 rounded px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder={defaultParams.n_cores.toString()}
                  value={params.n_cores}
                  onChange={e => handleParamChange('n_cores', e.target.value)}
                />
              </div>
              {/* Submit button, full width on both columns, gray style */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-mono px-6 py-2 rounded border border-zinc-600 shadow transition-colors duration-150 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Running Simulation...' : 'Run Simulation'}
                </button>
              </div>
            </form>
            {/* Result/Error display */}
            {error && (
              <div className="mt-4 text-red-400 text-sm">{error}</div>
            )}
            {result && (
              <>
                <div className="mt-4 text-green-300 text-sm whitespace-pre-wrap overflow-y-auto bg-zinc-900 rounded p-4 border border-zinc-700 w-full col-span-full">
                  {/* If result is an array, show the first object; else show the object */}
                  {Array.isArray(result) && result.length > 0 ? (
                    <ResultSummary result={result[0]} />
                  ) : typeof result === 'object' && result !== null ? (
                    <ResultSummary result={result} />
                  ) : (
                    <span>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</span>
                  )}
                </div>
                <div className="w-full flex flex-col gap-2 mt-2">
                  <button
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-mono px-4 py-2 rounded border border-zinc-600 shadow transition-colors duration-150"
                    onClick={() => downloadResult(result)}
                    type="button"
                  >
                    Download Full Results
                  </button>
                  {canContinue && (
                    <button
                      className="w-full bg-green-700 hover:bg-green-600 text-white font-mono px-4 py-2 rounded border border-green-800 shadow transition-colors duration-150"
                      onClick={onContinue}
                      type="button"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
    </>
  );
}

// ResultSummary component
function ResultSummary({ result }: { result: Record<string, unknown> }) {
  const iterations = result.iterations;
  const hasIterations = iterations !== undefined && iterations !== null && iterations !== '';
  
  return (
    <div className="space-y-2">
      {hasIterations && (
        <div className="font-bold text-green-200">Iterations: {String(iterations)}</div>
      )}
      {Object.entries(result).map(([key, value]) => (
        key !== 'iterations' && (
          <div key={key}>
            <span className="font-mono text-green-400">{key}:</span> <span className="text-green-100">{String(value)}</span>
          </div>
        )
      ))}
    </div>
  );
}

// Download helper
function downloadResult(result: Record<string, unknown>) {
  const dataStr = JSON.stringify(result, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'permeability-results.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default ComputerComponent; 