import { Cloudinary } from '@cloudinary/url-gen';

export const cld = new Cloudinary({ 
  cloud: {
    cloudName: 'duso7hfej' // Replace with your Cloudinary cloud name
  },
  url: {
    secure: true
  }
});

export const uploadToCloudinary = async (file: any, productId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'kisanapp'); // Replace with your upload preset
  formData.append('folder', `products/${productId}`);
  
  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/duso7hfej/image/upload', {
      method: 'POST',
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};