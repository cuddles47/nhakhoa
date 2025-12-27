import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import imageService from '../../../services/imageService';
import { QUERY_KEYS } from '../../../constants';
import toast from 'react-hot-toast';

/**
 * useVisitImages Hook
 * Fetch all images for a visit
 */
export const useVisitImages = (visitId, category = null) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.IMAGES(visitId), category],
    queryFn: () => imageService.getVisitImages(visitId, category),
    enabled: !!visitId,
    staleTime: 30000
  });
};

/**
 * useUploadImage Hook
 * Upload single image
 */
export const useUploadImage = (visitId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageData) => imageService.uploadImage(visitId, imageData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMAGES(visitId) });
      toast.success(data.message || 'Tải ảnh lên thành công');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh';
      toast.error(message);
    }
  });
};

/**
 * useUpdateValidation Hook
 * Update image validation status
 */
export const useUpdateValidation = (visitId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, status }) => imageService.updateValidationStatus(imageId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMAGES(visitId) });
      toast.success(data.message || 'Cập nhật trạng thái thành công');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  });
};

/**
 * useDeleteImage Hook
 * Delete image
 */
export const useDeleteImage = (visitId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId) => imageService.deleteImage(imageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMAGES(visitId) });
      toast.success(data.message || 'Xóa ảnh thành công');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  });
};
