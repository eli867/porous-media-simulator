'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Play, AlertCircle, CheckCircle, Settings, BarChart3 } from 'lucide-react';

interface SimulationResults {
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
  data?: SimulationResults;
  error?: string;
  message?: string;
}

export default function FluidSimulator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parameters, setParameters] = useState({
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
      setResults(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleParameterChange = (key: string, value: string) => {
    setParameters(prev => ({
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
    setResults(null);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    // Add parameters to form data
    Object.entries(parameters).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        setResults(data.data);
      } else {
        setError(data.error || 'Processing failed');
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatNumber = (num: number | null | undefined, decimals = 6): string => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (Math.abs(num) < 1e-3 || Math.abs(num) > 1e3) {
      return num.toExponential(decimals);
    }
    return num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Fluid Permeability Simulator
          </h1>
          <p className="text-lg text-gray-600">
            Upload a grayscale image to analyze fluid permeability through porous media
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Image Upload
                </CardTitle>
                <CardDescription>
                  Select a grayscale image representing porous media structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-48 mx-auto rounded"
                        />
                        <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-gray-600">Click to upload image</p>
                        <p className="text-xs text-gray-500">PNG, JPG, or other image formats</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Simulation Parameters
                </CardTitle>
                <CardDescription>
                  Configure the fluid and simulation properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="density">Density (kg/m³)</Label>
                    <Input
                      id="density"
                      type="number"
                      value={parameters.density}
                      onChange={(e) => handleParameterChange('density', e.target.value)}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="viscosity">Viscosity (Pa·s)</Label>
                    <Input
                      id="viscosity"
                      type="number"
                      value={parameters.viscosity}
                      onChange={(e) => handleParameterChange('viscosity', e.target.value)}
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain_width">Domain Width (m)</Label>
                    <Input
                      id="domain_width"
                      type="number"
                      value={parameters.domain_width}
                      onChange={(e) => handleParameterChange('domain_width', e.target.value)}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mesh_amp">Mesh Amplification</Label>
                    <Input
                      id="mesh_amp"
                      type="number"
                      value={parameters.mesh_amp}
                      onChange={(e) => handleParameterChange('mesh_amp', e.target.value)}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_iter">Max Iterations</Label>
                    <Input
                      id="max_iter"
                      type="number"
                      value={parameters.max_iter}
                      onChange={(e) => handleParameterChange('max_iter', e.target.value)}
                      min="100"
                      step="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="n_cores">CPU Cores</Label>
                    <Input
                      id="n_cores"
                      type="number"
                      value={parameters.n_cores}
                      onChange={(e) => handleParameterChange('n_cores', e.target.value)}
                      min="1"
                      max="8"
                      step="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Process Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || isProcessing}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
          
          {/* Right Column - Results */}
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isProcessing && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing...</CardTitle>
                  <CardDescription>
                    Running fluid permeability simulation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={50} className="w-full" />
                    <p className="text-sm text-gray-600 text-center">
                      This may take several minutes depending on image size and parameters
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Simulation Results
                  </CardTitle>
                  <CardDescription>
                    Completed in {results.simulation_time?.toFixed(2)} seconds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="convergence">Convergence</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-blue-900">Permeability</h3>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatNumber(results.permeability, 3)}
                          </p>
                          <p className="text-sm text-blue-600">m²</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-green-900">Porosity</h3>
                          <p className="text-2xl font-bold text-green-700">
                            {results.porosity ? (results.porosity * 100).toFixed(2) : 'N/A'}
                          </p>
                          <p className="text-sm text-green-600">%</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-purple-900">Iterations</h3>
                          <p className="text-2xl font-bold text-purple-700">
                            {results.iterations}
                          </p>
                          <p className="text-sm text-purple-600">steps</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-orange-900">Convergence</h3>
                          <p className="text-2xl font-bold text-orange-700">
                            {formatNumber(results.convergence_rms, 2)}
                          </p>
                          <p className="text-sm text-orange-600">RMS</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold">Image Properties</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p>Dimensions: {results.image_properties?.width} × {results.image_properties?.height} pixels</p>
                          <p>Channels: {results.image_properties?.channels}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Simulation Parameters</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                          <p>Density: {results.simulation_parameters?.density} kg/m³</p>
                          <p>Viscosity: {results.simulation_parameters?.viscosity} Pa·s</p>
                          <p>Domain Width: {results.simulation_parameters?.domain_width} m</p>
                          <p>Mesh Amplification: {results.simulation_parameters?.mesh_amplification}</p>
                          <p>Max Iterations: {results.simulation_parameters?.max_iterations}</p>
                          <p>CPU Cores: {results.simulation_parameters?.cpu_cores}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="convergence" className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Convergence History
                        </h3>
                        {results.convergence_history && results.convergence_history.length > 0 ? (
                          <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                            <div className="text-xs font-mono space-y-1">
                              <div className="grid grid-cols-4 gap-2 font-semibold border-b pb-1">
                                <span>Iter</span>
                                <span>Permeability</span>
                                <span>Residual</span>
                                <span>Alpha</span>
                              </div>
                              {results.convergence_history.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-4 gap-2">
                                  <span>{row.iteration}</span>
                                  <span>{formatNumber(row.permeability, 2)}</span>
                                  <span>{formatNumber(row.residual, 2)}</span>
                                  <span>{row.alpha}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">No convergence data available</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

