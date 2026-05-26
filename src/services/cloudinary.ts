const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'gamezone-pro';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gamezone_uploads';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

export const uploadImage = async (
  file: File,
  folder: string = 'gamezone',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('quality', 'auto');
  formData.append('fetch_format', 'auto');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          format: response.format,
          width: response.width,
          height: response.height,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.send(formData);
  });
};

export const getOptimizedUrl = (url: string, width: number = 400, height: number = 400): string => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
};

export const deleteImage = async (publicId: string): Promise<void> => {
  // Note: Deletion requires server-side API - implement via Firebase Functions
  console.log('Delete image:', publicId);
};
