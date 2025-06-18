'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, AlertCircle, CheckCircle, Settings, BarChart3 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface PermeabilityResults {
  permeability: number;
  porosity: number | null;
  iterations: number;
  convergence_rms: number;
  simulation_time: number;
  image_properties: {
    width: number;
    height: number;
    channels: number;
  };
  simulation_parameters: {
    density: number;
    viscosity: number;
    domain_width: number;
    mesh_amplification: number;
    max_iterations: number;
    convergence_criteria: number;
    cpu_cores: number;
  };
  convergence_history: Array<{
    iteration: number;
    permeability: number;
    residual: number;
    alpha: number;
    mesh: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  data?: PermeabilityResults;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permeabilityResults, setPermeabilityResults] = useState<PermeabilityResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Permeability parameters
  const [permeabilityParams, setPermeabilityParams] = useState({
    density: 1000.0,
    viscosity: 0.001,
    domain_width: 1.0,
    mesh_amp: 1,
    max_iter: 10000,
    convergence_rms: 0.000001,
    n_cores: 4
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setPermeabilityResults(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePermeabilityParamChange = (key: string, value: string) => {
    setPermeabilityParams(prev => ({
      ...prev,
      [key]: parseFloat(value) || parseInt(value) || value
    }));
  };
  
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setPermeabilityResults(null);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    // Add permeability parameters to form data
    Object.entries(permeabilityParams).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        setPermeabilityResults(data.data as PermeabilityResults);
      } else {
        setError(data.error || 'Simulation failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatNumber = (num: number | null | undefined, decimals = 6): string => {
    if (num === null || num === undefined) return 'N/A';
    return num.toExponential(decimals);
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPermeabilityResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Fluid Permeability Simulator
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Advanced fluid permeability analysis through porous media simulation
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input and Parameters */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Image Upload
                </CardTitle>
                <CardDescription>
                  Upload a porous media image for permeability analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-4"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supports JPG, PNG, BMP formats
                  </p>
                </div>
                
                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permeability Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Permeability Parameters
                </CardTitle>
                <CardDescription>
                  Configure simulation parameters for permeability analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="density">Fluid Density (kg/m³)</Label>
                    <Input
                      id="density"
                      type="number"
                      step="0.1"
                      value={permeabilityParams.density}
                      onChange={(e) => handlePermeabilityParamChange('density', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="viscosity">Viscosity (Pa·s)</Label>
                    <Input
                      id="viscosity"
                      type="number"
                      step="0.0001"
                      value={permeabilityParams.viscosity}
                      onChange={(e) => handlePermeabilityParamChange('viscosity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain_width">Domain Width (m)</Label>
                    <Input
                      id="domain_width"
                      type="number"
                      step="0.1"
                      value={permeabilityParams.domain_width}
                      onChange={(e) => handlePermeabilityParamChange('domain_width', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mesh_amp">Mesh Amplification</Label>
                    <Input
                      id="mesh_amp"
                      type="number"
                      min="1"
                      max="10"
                      value={permeabilityParams.mesh_amp}
                      onChange={(e) => handlePermeabilityParamChange('mesh_amp', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_iter">Max Iterations</Label>
                    <Input
                      id="max_iter"
                      type="number"
                      min="1000"
                      max="100000"
                      value={permeabilityParams.max_iter}
                      onChange={(e) => handlePermeabilityParamChange('max_iter', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="convergence_rms">Convergence RMS</Label>
                    <Input
                      id="convergence_rms"
                      type="number"
                      step="0.000001"
                      value={permeabilityParams.convergence_rms}
                      onChange={(e) => handlePermeabilityParamChange('convergence_rms', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="n_cores">CPU Cores</Label>
                    <Input
                      id="n_cores"
                      type="number"
                      min="1"
                      max="32"
                      value={permeabilityParams.n_cores}
                      onChange={(e) => handlePermeabilityParamChange('n_cores', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Run Simulation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedFile || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running permeability simulation
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Permeability Simulation
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    Reset
                  </Button>
                </div>
                
                {isProcessing && (
                  <div className="mt-4">
                    <Progress value={undefined} className="w-full" />
                    <p className="text-sm text-gray-500 mt-2">Processing image...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Display */}
            {permeabilityResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Permeability Results
                  </CardTitle>
                  <CardDescription>
                    Completed in {permeabilityResults.simulation_time?.toFixed(2)} seconds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Permeability</h3>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {formatNumber(permeabilityResults.permeability, 3)} m²
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 dark:text-green-100">Porosity</h3>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {permeabilityResults.porosity ? (permeabilityResults.porosity * 100).toFixed(2) : 'N/A'}%
                      </p>
                    </div>
                  </div>

                  {/* Simulation Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Simulation Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Iterations</p>
                        <p className="font-medium">{permeabilityResults.iterations}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Convergence RMS</p>
                        <p className="font-medium">{formatNumber(permeabilityResults.convergence_rms, 6)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Image Dimensions</p>
                        <p className="font-medium">{permeabilityResults.image_properties?.width} × {permeabilityResults.image_properties?.height} pixels</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Channels</p>
                        <p className="font-medium">{permeabilityResults.image_properties?.channels}</p>
                      </div>
                    </div>
                  </div>

                  {/* Parameters Used */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Parameters Used</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Fluid Density</p>
                        <p className="font-medium">{permeabilityResults.simulation_parameters?.density} kg/m³</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Viscosity</p>
                        <p className="font-medium">{permeabilityResults.simulation_parameters?.viscosity} Pa·s</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Domain Width</p>
                        <p className="font-medium">{permeabilityResults.simulation_parameters?.domain_width} m</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Mesh Amplification</p>
                        <p className="font-medium">{permeabilityResults.simulation_parameters?.mesh_amplification}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Max Iterations</p>
                        <p className="font-medium">{permeabilityResults.simulation_parameters?.max_iterations}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">CPU Cores</p>
                        <p className="font-medium">{permeabilityResults.simulation_parameters?.cpu_cores}</p>
                      </div>
                    </div>
                  </div>

                  {/* Convergence History Chart */}
                  {permeabilityResults.convergence_history && permeabilityResults.convergence_history.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Convergence History
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="space-y-2">
                          {permeabilityResults.convergence_history.slice(-5).map((entry, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>Iteration {entry.iteration}:</span>
                              <span className="font-medium">{formatNumber(entry.permeability, 3)} m²</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 