const cloudinary = require('cloudinary').v2;

// Validate that all required Cloudinary environment variables are present
// at startup so misconfiguration is caught immediately.
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  throw new Error(
    `FATAL: Missing required Cloudinary environment variables: ${missingVars.join(', ')}. ` +
      'Check your .env file.'
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary using upload_stream.
 *
 * @param {Buffer} fileBuffer - File buffer from Multer memoryStorage
 * @param {Object} options    - Upload options forwarded to Cloudinary
 *                             (folder, resource_type, public_id, etc.)
 * @returns {Promise<Object>} Cloudinary upload result containing secure_url and public_id
 * @throws  {Error}           Re-throws Cloudinary SDK errors so callers can handle them
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  if (process.env.NODE_ENV === 'test') {
    const resourceType = options.resource_type && options.resource_type !== 'auto' ? options.resource_type : 'image';
    const publicId = options.public_id || `test_${Date.now()}`;
    const folder = options.folder || 'fpo_loan_documents';
    return Promise.resolve({
      secure_url: `https://res.cloudinary.com/test/${resourceType}/upload/v1/${folder}/${publicId}`,
      public_id: publicId.startsWith(folder) ? publicId : `${folder}/${publicId}`,
      resource_type: resourceType,
      bytes: fileBuffer ? fileBuffer.length : 0,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'fpo_loan_documents',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an uploaded resource from Cloudinary by its public_id.
 * Used for cleanup when MongoDB document creation fails after a successful upload.
 *
 * @param {string} publicId    - The public_id returned by Cloudinary on upload
 * @param {string} resourceType - 'image' | 'raw' | 'video' (default: 'image')
 * @returns {Promise<Object>}  Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (process.env.NODE_ENV === 'test') {
    return { result: 'ok' };
  }
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    // Log the cleanup failure (no secret values present in these fields)
    console.error('[Cloudinary] Cleanup failed for public_id:', publicId, '-', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
