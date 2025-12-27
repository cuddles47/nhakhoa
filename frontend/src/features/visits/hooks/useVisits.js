import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import visitService from '../../services/visitService';
import { QUERY_KEYS } from '../../constants';
import toast from 'react-hot-toast';

/**
 * useVisits Hook
 * Fetch all visits with optional filters
 */
export const useVisits = (filters = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.VISITS, filters],
    queryFn: () => visitService.getVisits(filters),
    staleTime: 30000
  });
};

/**
 * useVisit Hook
 * Fetch single visit by ID
 */
export const useVisit = (id) => {
  return useQuery({
    queryKey: QUERY_KEYS.VISIT(id),
    queryFn: () => visitService.getVisit(id),
    enabled: !!id
  });
};

/**
 * usePatientVisits Hook
 * Fetch all visits for a specific patient
 */
export const usePatientVisits = (patientId) => {
  return useQuery({
    queryKey: QUERY_KEYS.PATIENT_VISITS(patientId),
    queryFn: () => visitService.getPatientVisits(patientId),
    enabled: !!patientId,
    staleTime: 30000
  });
};

/**
 * useCreateVisit Hook
 * Create new visit
 */
export const useCreateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitData) => visitService.createVisit(visitData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PATIENT_VISITS(variables.patient_id) });
      toast.success(data.message || 'Tạo lượt khám thành công');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  });
};

/**
 * useUpdateVisit Hook
 * Update existing visit
 */
export const useUpdateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => visitService.updateVisit(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISIT(variables.id) });
      toast.success(data.message || 'Cập nhật lượt khám thành công');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  });
};

/**
 * useDeleteVisit Hook
 * Delete visit (soft delete)
 */
export const useDeleteVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => visitService.deleteVisit(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITS });
      toast.success(data.message || 'Xóa lượt khám thành công');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  });
};
