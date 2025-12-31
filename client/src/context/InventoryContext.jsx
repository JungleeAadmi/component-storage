import { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(0);

  // Fetch containers only if stale (older than 1 minute) or forced
  const fetchContainers = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && containers.length > 0 && (now - lastFetched < 60000)) {
      return; 
    }

    setLoading(true);
    try {
      const { data } = await api.get('/inventory/containers');
      setContainers(data);
      setLastFetched(now);
    } catch (error) {
      console.error("Failed to load inventory", error);
    } finally {
      setLoading(false);
    }
  }, [containers, lastFetched]);

  const refreshInventory = () => fetchContainers(true);

  return (
    <InventoryContext.Provider value={{ containers, loading, fetchContainers, refreshInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};