import { documentAPI } from '../api/client';

export const openDocumentPreview = async (document) => {
  if (!document?._id) {
    throw new Error('Document ID is required to preview a file.');
  }

  const response = await documentAPI.getDocumentFile(document._id);
  const blobUrl = URL.createObjectURL(response.data);
  const previewWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

  if (!previewWindow) {
    window.location.assign(blobUrl);
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};
