import { useState, useEffect } from 'react';
import api from '../services/api';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        // Handle both array response and paginated response { data: [...] }
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || []);
          
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, loading, error };
};
