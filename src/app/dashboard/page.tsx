'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { API_CONFIG, APP_CONFIG } from '@/lib/config';

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Permeability parameters
  const [permeabilityParams, setPermeabilityParams] = useState(APP_CONFIG.DEFAULT_PARAMS);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setRawResult(null);
      
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
    setRawResult(null);
    setResultData(null);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    // Add permeability parameters to form data
    Object.entries(permeabilityParams).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    try {
      // Use the Railway backend URL
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROCESS_IMAGE}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Simulation failed: ${errorText}`);
        return;
      }
      
      // Get JSON response
      const data = await response.json();
      setResultData(data);
      
    } catch (err: unknown) {
      setError('Network error occurred');
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRawResult(null);
    setResultData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Helper to safely render cell values
  const renderCell = (val: unknown) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
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
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={400}
                      height={300}
                      className="max-w-full h-auto rounded-lg border"
                      style={{ objectFit: 'contain' }}
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

            {/* Structured Results Display */}
            {resultData && resultData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Simulation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-300 dark:border-gray-700">
                      <thead>
                        <tr>
                          {Object.keys(resultData[0]).map((key) => (
                            <th key={key} className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-left font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultData.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="px-2 py-1 border-b border-gray-100 dark:border-gray-800">
                                {renderCell(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug: Show raw resultData for troubleshooting */}
            {resultData && (
              <pre className="mt-4 p-2 bg-yellow-50 text-xs text-gray-700 border border-yellow-200 rounded">
                {JSON.stringify(resultData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 