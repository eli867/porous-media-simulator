'use client'

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PermeabilityResultsCard from '@/components/PermeabilityResultsCard';

const defaultParams = {
  density: 1000,
  viscosity: 0.001,
  domain_width: 1.0,
  mesh_amp: 1,
  max_iter: 10000,
  convergence_rms: 0.000001,
  n_cores: 4,
};

export default function CommandsPage() {
  const [params, setParams] = useState({ ...defaultParams });
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult([]);
    setLoading(true);
    try {
      if (!file) {
        setError('Please select an image file.');
        setLoading(false);
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
        setLoading(false);
        return;
      }
      const data = await response.json();
      setResult(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-2">
      <section className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-zinc-200 shadow-lg p-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">Fluid Permeability Simulation</h1>
        <p className="text-base text-zinc-700 text-center mb-8">
          Upload a black-and-white image of your porous medium and enter simulation parameters below. Results will be displayed upon completion.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="image-upload" className="mb-2">Porous Medium Image (PNG/JPG)</Label>
            <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} required className="mt-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="density">Density (kg/m³)</Label>
              <Input id="density" type="number" step="any" value={params.density} onChange={e => handleParamChange('density', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="viscosity">Viscosity (Pa·s)</Label>
              <Input id="viscosity" type="number" step="any" value={params.viscosity} onChange={e => handleParamChange('viscosity', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="domain_width">Domain Width (m)</Label>
              <Input id="domain_width" type="number" step="any" value={params.domain_width} onChange={e => handleParamChange('domain_width', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="mesh_amp">Mesh Amplification</Label>
              <Input id="mesh_amp" type="number" step="any" value={params.mesh_amp} onChange={e => handleParamChange('mesh_amp', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="max_iter">Max Iterations</Label>
              <Input id="max_iter" type="number" step="1" value={params.max_iter} onChange={e => handleParamChange('max_iter', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="convergence_rms">Convergence RMS</Label>
              <Input id="convergence_rms" type="number" step="any" value={params.convergence_rms} onChange={e => handleParamChange('convergence_rms', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="n_cores">CPU Cores</Label>
              <Input id="n_cores" type="number" step="1" value={params.n_cores} onChange={e => handleParamChange('n_cores', e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-center">
            <Button type="submit" disabled={loading} className="w-full" variant={'outline'}>
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </div>
        </form>
        {error && <div className="mt-6 text-red-600 text-center">{error}</div>}
        {result && result.length > 0 && (
          <div className="mt-8">
            <PermeabilityResultsCard results={result} />
          </div>
        )}
      </section>
    </main>
  );
} 