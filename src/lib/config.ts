// API Configuration
export const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to local Next.js API
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  ENDPOINTS: {
    PROCESS_IMAGE: '/api/simulate',
    HEALTH: '/api/health'
  }
} as const;

// Application Configuration
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/bmp'],
  DEFAULT_PARAMS: {
    density: 1000,
    viscosity: 0.001,
    domain_width: 0.01,
    mesh_amp: 2,
    max_iter: 10000,
    convergence_rms: 1e-6,
    n_cores: 4
  }
} as const; 