'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Play, AlertCircle, CheckCircle, Settings, BarChart3, Zap } from 'lucide-react';
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

interface DiffusivityResults {
  diffusivity: number;
  tortuosity: number | null;
  porosity: number | null;
  iterations: number;
  simulation_time: number;
  image_properties: {
    width: number;
    height: number;
    channels: number;
  };
  simulation_parameters: {
    nD: number;
    inputType: number;
    numDC: number;
    D1: number;
    D2: number;
    D3: number;
    D_TH1: number;
    D_TH2: number;
    D_TH3: number;
    meshAmpX: number;
    meshAmpY: number;
    convergence: number;
    maxIter: number;
    CL: number;
    CR: number;
    nThreads: number;
    useGPU: number;
    nGPU: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: PermeabilityResults | DiffusivityResults;
  error?: string;
  message?: string;
}

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permeabilityResults, setPermeabilityResults] = useState<PermeabilityResults | null>(null);
  const [diffusivityResults, setDiffusivityResults] = useState<DiffusivityResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('permeability');
  const [gpuAvailable, setGpuAvailable] = useState<boolean | null>(null);
  
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

  // Diffusivity parameters
  const [diffusivityParams, setDiffusivityParams] = useState({
    nD: 2,
    inputType: 2,
    numDC: 3,
    D1: 0,
    D2: 3e-12,
    D3: 1e-14,
    D_TH1: 40,
    D_TH2: 170,
    D_TH3: 255,
    meshAmpX: 1,
    meshAmpY: 1,
    convergence: 1e-7,
    maxIter: 1000000,
    CL: 0,
    CR: 1,
    nThreads: 8,
    useGPU: 1,
    nGPU: 1,
    verbose: 1
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check GPU availability on component mount
  useEffect(() => {
    const checkGpuAvailability = async () => {
      try {
        const response = await fetch('/api/process-diffusivity', { method: 'GET' });
        const data = await response.json();
        setGpuAvailable(data.gpu_available || false);
      } catch (error) {
        console.log('GPU check failed, assuming unavailable');
        setGpuAvailable(false);
      }
    };
    
    checkGpuAvailability();
  }, []);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setPermeabilityResults(null);
      setDiffusivityResults(null);
      
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

  const handleDiffusivityParamChange = (key: string, value: string) => {
    setDiffusivityParams(prev => ({
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
    setDiffusivityResults(null);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    // Add parameters to form data based on active tab
    if (activeTab === 'permeability') {
      Object.entries(permeabilityParams).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    } else {
      Object.entries(diffusivityParams).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }
    
    try {
      const endpoint = activeTab === 'permeability' ? '/api/process-image' : '/api/process-diffusivity';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        if (activeTab === 'permeability') {
          setPermeabilityResults(data.data as PermeabilityResults);
        } else {
          setDiffusivityResults(data.data as DiffusivityResults);
        }
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Fluid & Diffusion Simulator
            </h1>
            <p className="text-muted-foreground mt-1">
              Advanced fluid permeability and effective diffusivity analysis through porous media simulation
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="permeability" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Permeability
            </TabsTrigger>
            <TabsTrigger value="diffusivity" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Diffusivity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permeability" className="space-y-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {previewUrl ? (
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-w-full max-h-48 mx-auto rounded border"
                            />
                            <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="text-foreground">Click to upload image</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, or other image formats</p>
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
                
                {/* Permeability Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Permeability Parameters
                    </CardTitle>
                    <CardDescription>
                      Configure the fluid and simulation properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="density">Density (kg/m³)</Label>
                        <Input
                          id="density"
                          type="number"
                          value={permeabilityParams.density}
                          onChange={(e) => handlePermeabilityParamChange('density', e.target.value)}
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viscosity">Viscosity (Pa·s)</Label>
                        <Input
                          id="viscosity"
                          type="number"
                          value={permeabilityParams.viscosity}
                          onChange={(e) => handlePermeabilityParamChange('viscosity', e.target.value)}
                          step="0.0001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domain_width">Domain Width (m)</Label>
                        <Input
                          id="domain_width"
                          type="number"
                          value={permeabilityParams.domain_width}
                          onChange={(e) => handlePermeabilityParamChange('domain_width', e.target.value)}
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mesh_amp">Mesh Amplification</Label>
                        <Input
                          id="mesh_amp"
                          type="number"
                          value={permeabilityParams.mesh_amp}
                          onChange={(e) => handlePermeabilityParamChange('mesh_amp', e.target.value)}
                          min="1"
                          step="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_iter">Max Iterations</Label>
                        <Input
                          id="max_iter"
                          type="number"
                          value={permeabilityParams.max_iter}
                          onChange={(e) => handlePermeabilityParamChange('max_iter', e.target.value)}
                          min="100"
                          step="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="n_cores">CPU Cores</Label>
                        <Input
                          id="n_cores"
                          type="number"
                          value={permeabilityParams.n_cores}
                          onChange={(e) => handlePermeabilityParamChange('n_cores', e.target.value)}
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
                      Run Permeability Simulation
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
                        <p className="text-sm text-muted-foreground text-center">
                          This may take several minutes depending on image size and parameters
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {permeabilityResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Permeability Results
                      </CardTitle>
                      <CardDescription>
                        Completed in {permeabilityResults.simulation_time?.toFixed(2)} seconds
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
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Permeability</h3>
                              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {formatNumber(permeabilityResults.permeability, 3)}
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">m²</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-green-900 dark:text-green-100">Porosity</h3>
                              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {permeabilityResults.porosity ? (permeabilityResults.porosity * 100).toFixed(2) : 'N/A'}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">%</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Iterations</h3>
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                {permeabilityResults.iterations}
                              </p>
                              <p className="text-sm text-purple-600 dark:text-purple-400">steps</p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-orange-900 dark:text-orange-100">Convergence</h3>
                              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                {formatNumber(permeabilityResults.convergence_rms, 2)}
                              </p>
                              <p className="text-sm text-orange-600 dark:text-orange-400">RMS</p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="details" className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold">Image Properties</h3>
                            <div className="bg-muted p-3 rounded text-sm">
                              <p>Dimensions: {permeabilityResults.image_properties?.width} × {permeabilityResults.image_properties?.height} pixels</p>
                              <p>Channels: {permeabilityResults.image_properties?.channels}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold">Simulation Parameters</h3>
                            <div className="bg-muted p-3 rounded text-sm space-y-1">
                              <p>Density: {permeabilityResults.simulation_parameters?.density} kg/m³</p>
                              <p>Viscosity: {permeabilityResults.simulation_parameters?.viscosity} Pa·s</p>
                              <p>Domain Width: {permeabilityResults.simulation_parameters?.domain_width} m</p>
                              <p>Mesh Amplification: {permeabilityResults.simulation_parameters?.mesh_amplification}</p>
                              <p>Max Iterations: {permeabilityResults.simulation_parameters?.max_iterations}</p>
                              <p>CPU Cores: {permeabilityResults.simulation_parameters?.cpu_cores}</p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="convergence" className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Convergence History
                            </h3>
                            {permeabilityResults.convergence_history && permeabilityResults.convergence_history.length > 0 ? (
                              <div className="bg-muted p-3 rounded max-h-64 overflow-y-auto">
                                <div className="text-xs font-mono space-y-1">
                                  <div className="grid grid-cols-4 gap-2 font-semibold border-b pb-1">
                                    <span>Iter</span>
                                    <span>Permeability</span>
                                    <span>Residual</span>
                                    <span>Alpha</span>
                                  </div>
                                  {permeabilityResults.convergence_history.map((row, idx) => (
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
                              <p className="text-muted-foreground">No convergence data available</p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="diffusivity" className="space-y-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column - Input */}
              <div className="space-y-6">
                {/* GPU Availability Warning */}
                {gpuAvailable === false && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>GPU Not Available:</strong> Effective diffusivity simulation requires NVIDIA GPU with CUDA support. 
                      This feature is not available in your current environment. You can still use the permeability simulation.
                    </AlertDescription>
                  </Alert>
                )}
                
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
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {previewUrl ? (
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-w-full max-h-48 mx-auto rounded border"
                            />
                            <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="text-foreground">Click to upload image</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, or other image formats</p>
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
                
                {/* Diffusivity Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Diffusivity Parameters
                    </CardTitle>
                    <CardDescription>
                      Configure the diffusion simulation properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nD">Dimensions</Label>
                        <Input
                          id="nD"
                          type="number"
                          value={diffusivityParams.nD}
                          onChange={(e) => handleDiffusivityParamChange('nD', e.target.value)}
                          min="2"
                          max="3"
                          step="1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="D2">Diffusion Coefficient 2 (m²/s)</Label>
                        <Input
                          id="D2"
                          type="number"
                          value={diffusivityParams.D2}
                          onChange={(e) => handleDiffusivityParamChange('D2', e.target.value)}
                          step="1e-15"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="D3">Diffusion Coefficient 3 (m²/s)</Label>
                        <Input
                          id="D3"
                          type="number"
                          value={diffusivityParams.D3}
                          onChange={(e) => handleDiffusivityParamChange('D3', e.target.value)}
                          step="1e-15"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="D_TH1">Threshold 1</Label>
                        <Input
                          id="D_TH1"
                          type="number"
                          value={diffusivityParams.D_TH1}
                          onChange={(e) => handleDiffusivityParamChange('D_TH1', e.target.value)}
                          min="0"
                          max="255"
                          step="1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="D_TH2">Threshold 2</Label>
                        <Input
                          id="D_TH2"
                          type="number"
                          value={diffusivityParams.D_TH2}
                          onChange={(e) => handleDiffusivityParamChange('D_TH2', e.target.value)}
                          min="0"
                          max="255"
                          step="1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="D_TH3">Threshold 3</Label>
                        <Input
                          id="D_TH3"
                          type="number"
                          value={diffusivityParams.D_TH3}
                          onChange={(e) => handleDiffusivityParamChange('D_TH3', e.target.value)}
                          min="0"
                          max="255"
                          step="1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="convergence">Convergence</Label>
                        <Input
                          id="convergence"
                          type="number"
                          value={diffusivityParams.convergence}
                          onChange={(e) => handleDiffusivityParamChange('convergence', e.target.value)}
                          step="1e-10"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxIter">Max Iterations</Label>
                        <Input
                          id="maxIter"
                          type="number"
                          value={diffusivityParams.maxIter}
                          onChange={(e) => handleDiffusivityParamChange('maxIter', e.target.value)}
                          min="1000"
                          step="1000"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="CL">Left Boundary</Label>
                        <Input
                          id="CL"
                          type="number"
                          value={diffusivityParams.CL}
                          onChange={(e) => handleDiffusivityParamChange('CL', e.target.value)}
                          step="0.1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="CR">Right Boundary</Label>
                        <Input
                          id="CR"
                          type="number"
                          value={diffusivityParams.CR}
                          onChange={(e) => handleDiffusivityParamChange('CR', e.target.value)}
                          step="0.1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nThreads">CPU Threads</Label>
                        <Input
                          id="nThreads"
                          type="number"
                          value={diffusivityParams.nThreads}
                          onChange={(e) => handleDiffusivityParamChange('nThreads', e.target.value)}
                          min="1"
                          max="16"
                          step="1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="useGPU">Use GPU</Label>
                        <Input
                          id="useGPU"
                          type="number"
                          value={diffusivityParams.useGPU}
                          onChange={(e) => handleDiffusivityParamChange('useGPU', e.target.value)}
                          min="0"
                          max="1"
                          step="1"
                          disabled={gpuAvailable === false}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Process Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedFile || isProcessing || gpuAvailable === false}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : gpuAvailable === false ? (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      GPU Not Available
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Run Diffusivity Simulation
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
                        Running effective diffusivity simulation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={50} className="w-full" />
                        <p className="text-sm text-muted-foreground text-center">
                          This may take several minutes depending on image size and parameters
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {diffusivityResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Diffusivity Results
                      </CardTitle>
                      <CardDescription>
                        Completed in {diffusivityResults.simulation_time?.toFixed(2)} seconds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="summary" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="summary" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Effective Diffusivity</h3>
                              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {formatNumber(diffusivityResults.diffusivity, 3)}
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">m²/s</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-green-900 dark:text-green-100">Tortuosity</h3>
                              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {diffusivityResults.tortuosity ? formatNumber(diffusivityResults.tortuosity, 3) : 'N/A'}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">dimensionless</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Porosity</h3>
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                {diffusivityResults.porosity ? (diffusivityResults.porosity * 100).toFixed(2) : 'N/A'}
                              </p>
                              <p className="text-sm text-purple-600 dark:text-purple-400">%</p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border">
                              <h3 className="font-semibold text-orange-900 dark:text-orange-100">Iterations</h3>
                              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                {diffusivityResults.iterations}
                              </p>
                              <p className="text-sm text-orange-600 dark:text-orange-400">steps</p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="details" className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold">Image Properties</h3>
                            <div className="bg-muted p-3 rounded text-sm">
                              <p>Dimensions: {diffusivityResults.image_properties?.width} × {diffusivityResults.image_properties?.height} pixels</p>
                              <p>Channels: {diffusivityResults.image_properties?.channels}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold">Simulation Parameters</h3>
                            <div className="bg-muted p-3 rounded text-sm space-y-1">
                              <p>Dimensions: {diffusivityResults.simulation_parameters?.nD}D</p>
                              <p>Diffusion Coefficient 2: {formatNumber(diffusivityResults.simulation_parameters?.D2, 3)} m²/s</p>
                              <p>Diffusion Coefficient 3: {formatNumber(diffusivityResults.simulation_parameters?.D3, 3)} m²/s</p>
                              <p>Threshold 1: {diffusivityResults.simulation_parameters?.D_TH1}</p>
                              <p>Threshold 2: {diffusivityResults.simulation_parameters?.D_TH2}</p>
                              <p>Threshold 3: {diffusivityResults.simulation_parameters?.D_TH3}</p>
                              <p>Convergence: {formatNumber(diffusivityResults.simulation_parameters?.convergence, 3)}</p>
                              <p>Max Iterations: {diffusivityResults.simulation_parameters?.maxIter}</p>
                              <p>CPU Threads: {diffusivityResults.simulation_parameters?.nThreads}</p>
                              <p>Use GPU: {diffusivityResults.simulation_parameters?.useGPU ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 