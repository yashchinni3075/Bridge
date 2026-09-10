import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer to Cloudinary using upload_stream
 * Supports documents, images, and raw presentations (.pdf, .ppt, .pptx, images)
 * Enhanced to support custom publicId, overwriting, and cache invalidation.
 */
export const uploadToCloudinary = (fileBuffer, folderOrOptions, resourceType = 'auto', additionalOptions = {}) => {
  return new Promise((resolve, reject) => {
    let folder = 'bridge/general';
    let publicId = additionalOptions.publicId || null;
    let overwrite = additionalOptions.overwrite ?? false;
    let invalidate = additionalOptions.invalidate ?? false;

    if (typeof folderOrOptions === 'string') {
      folder = folderOrOptions;
    } else if (folderOrOptions && typeof folderOrOptions === 'object') {
      if (folderOrOptions.folder) {
        folder = folderOrOptions.folder;
      } else {
        const roleStr = typeof folderOrOptions.role === 'string' ? folderOrOptions.role : 'user';
        const userIdStr = typeof folderOrOptions.userId === 'string' ? folderOrOptions.userId : 'general';
        folder = `bridge/verification/${roleStr}/${userIdStr}`;
      }
      if (folderOrOptions.publicId) publicId = folderOrOptions.publicId;
      if (folderOrOptions.overwrite !== undefined) overwrite = folderOrOptions.overwrite;
      if (folderOrOptions.invalidate !== undefined) invalidate = folderOrOptions.invalidate;
    }

    const streamOptions = {
      folder,
      resource_type: resourceType,
      overwrite,
      invalidate,
    };

    if (publicId) {
      streamOptions.public_id = publicId;
      streamOptions.unique_filename = false;
      streamOptions.use_filename = false;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      streamOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Dedicated wrapper for verification buffers to properly parse options objects into folder strings
export const uploadVerificationBuffer = (fileBuffer, options = {}, resourceType = 'auto') => {
  return uploadToCloudinary(fileBuffer, options, resourceType);
};

export const uploadDocumentToCloudinary = uploadToCloudinary;

/**
 * Delete a Cloudinary asset by public ID safely
 */
export const deleteCloudinaryResource = async (publicId) => {
  if (!publicId) return;
  try {
    let cleanId = publicId;

    // Safety fallback: strip full URL if accidentally saved instead of public ID
    if (typeof cleanId === 'string' && cleanId.startsWith('http')) {
      const urlParts = cleanId.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        const pathSegments = urlParts.slice(uploadIndex + 2);
        const joinedPath = pathSegments.join('/');
        cleanId = joinedPath.substring(0, joinedPath.lastIndexOf('.')) || joinedPath;
      }
    }

    // Force deletion checks across image, raw, and video tiers
    await cloudinary.uploader.destroy(cleanId, { resource_type: 'image' });
    await cloudinary.uploader.destroy(cleanId, { resource_type: 'raw' });
    const finalAttempt = await cloudinary.uploader.destroy(cleanId, { resource_type: 'video' });

    return finalAttempt;
  } catch (error) {
    console.warn(`Cloudinary asset deletion warning for ${publicId}:`, error.message);
  }
};

export default cloudinary;