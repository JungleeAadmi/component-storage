const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3210/api';

// Helper function for fetch requests
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Components API
export const componentsAPI = {
  getAll: () => fetchAPI('/components'),
  
  getOne: (id) => fetchAPI(`/components/${id}`),
  
  create: (data) => fetchAPI('/components', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => fetchAPI(`/components/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  updateQuantity: (id, quantity) => fetchAPI(`/components/${id}/quantity`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  }),
  
  delete: (id) => fetchAPI(`/components/${id}`, {
    method: 'DELETE',
  }),
  
  search: (query) => fetchAPI(`/components/search?q=${encodeURIComponent(query)}`),
  
  getLowStock: () => fetchAPI('/components/low-stock'),
  
  getStatistics: () => fetchAPI('/components/statistics'),
};

// Containers API
export const containersAPI = {
  getAll: () => fetchAPI('/containers'),
  
  getOne: (id) => fetchAPI(`/containers/${id}`),
  
  create: (data) => fetchAPI('/containers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => fetchAPI(`/containers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => fetchAPI(`/containers/${id}`, {
    method: 'DELETE',
  }),
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file, componentId) => {
    const formData = new FormData();
    formData.append('image', file);
    if (componentId) {
      formData.append('componentId', componentId);
    }

    const url = `${API_BASE}/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },
  
  deleteImage: (filename) => fetchAPI(`/upload/${filename}`, {
    method: 'DELETE',
  }),
};
