import { storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export interface ImageUploadResult {
  url: string;
  name: string;
}

export async function uploadImage(file: File, path: string): Promise<ImageUploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, or WebP images are supported.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size exceeds 5MB limit.');
  }

  // If Firebase Storage is active, upload to cloud
  if (isFirebaseConfigured && storage) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storageRef = ref(storage, `${path}/${uniqueFileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl, name: file.name };
  }

  // Standalone / client mode: Compress and convert to base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize max dimension to 1400px to keep storage clean & fast
        const maxDim = 1400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ url: e.target?.result as string, name: file.name });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ url: compressedDataUrl, name: file.name });
      };
      img.onerror = () => reject(new Error('Failed to process image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
