export const API_CONFIG = {
  BASE_URL: 
  '', // Default to local API route
  ENDPOINTS: {
    PROCESS_IMAGE: 
    '/api/simulate', // This maps to your /api/simulate route
  },
};

export const APP_CONFIG = {
  DEFAULT_PARAMS: {
    density: 1000,
    viscosity: 0.001,
    domain_width: 1.0,
    mesh_amp: 1,
    max_iter: 10000,
    convergence_rms: 0.000001,
    n_cores: 4,
  },
};

