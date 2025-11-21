const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Components API
export const componentsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/components`);
    if (!response.ok) throw new Error('Failed to fetch components');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/components/${id}`);
    if (!response.ok) throw new Error('Failed to fetch component');
    return response.json();
  },

  create: async (componentData) => {
    const response = await fetch(`${API_BASE_URL}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    if (!response.ok) throw new Error('Failed to create component');
    return response.json();
  },

  update: async (id, componentData) => {
    const response = await fetch(`${API_BASE_URL}/components/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    if (!response.ok) throw new Error('Failed to update component');
    return response.json();
  },

  updateQuantity: async (id, quantity) => {
    const response = await fetch(`${API_BASE_URL}/components/${id}/quantity`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update quantity');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/components/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete component');
    return response.json();
  },

  search: async (query) => {
    const response = await fetch(`${API_BASE_URL}/components/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search components');
    return response.json();
  },
};

// Storage Containers API
export const containersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/containers`);
    if (!response.ok) throw new Error('Failed to fetch containers');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/containers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch container');
    return response.json();
  },

  create: async (containerData) => {
    const response = await fetch(`${API_BASE_URL}/containers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(containerData),
    });
    if (!response.ok) throw new Error('Failed to create container');
    return response.json();
  },

  update: async (id, containerData) => {
    const response = await fetch(`${API_BASE_URL}/containers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(containerData),
    });
    if (!response.ok) throw new Error('Failed to update container');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/containers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete container');
    return response.json();
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file, componentId) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('component_id', componentId);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
  },
};

// Dashboard Stats API
export const statsAPI = {
  getOverview: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/overview`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getLowStock: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/low-stock`);
    if (!response.ok) throw new Error('Failed to fetch low stock items');
    return response.json();
  },
};
