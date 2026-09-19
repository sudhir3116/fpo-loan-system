import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentService, loanService } from '../services/loan';
import { LoadingSpinner, ErrorMessage, EmptyState, Button } from '../components/UI';
import { DocumentStatusBadge } from '../components/StatusBadges';
import { Toast } from '../components/Modal';

const DocumentsPage = () => {
  const { id: loanId } = useParams();
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('ID_PROOF');

  const documentTypes = [
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'LAND_RECORD', label: 'Land Record' },
    { value: 'FPO_MEMBERSHIP', label: 'FPO Membership' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement' },
    { value: 'FINANCIAL_REPORT', label: 'Financial Report' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    fetchData();
  }, [loanId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [loanData, docData] = await Promise.all([
        loanService.getLoanById(loanId),
        documentService.getLoanDocuments(loanId),
      ]);
      setLoan(loanData);
      setDocuments(docData || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5 MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      return 'File size must not exceed 5 MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, JPG, and PNG files are allowed';
    }

    return '';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setError('');
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !selectedType) {
      setError('Please select both a file and document type');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await documentService.uploadDocument(loanId, selectedType, selectedFile);
      setSuccess('Document uploaded successfully!');
      setSelectedFile(null);
      setSelectedType('ID_PROOF');
      document.getElementById('fileInput').value = '';
      
      // Refresh documents list
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const doc = documentTypes.find(d => d.value === type);
    return doc ? doc.label : type;
  };

  if (loading) {
    return (
      <div>
        <Link to={`/farmer/loans/${loanId}`} className="text-green-600 hover:text-green-700 font-medium mb-6 inline-block">
          ← Back to Loan
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Documents</h1>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to={`/farmer/loans/${loanId}`} className="text-green-600 hover:text-green-700 font-medium mb-2 inline-block">
          ← Back to Loan Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Loan Documents</h1>
        <p className="text-gray-600 mt-1">Upload and manage your loan documents</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Document</h2>
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Type */}
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <select
                id="documentType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Input */}
            <div>
              <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700">
                Select File
              </label>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition file:bg-green-50 file:border-0 file:rounded file:px-3 file:py-1 file:text-sm file:font-medium file:text-green-700"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5 MB • PDF, JPG, PNG only</p>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Uploaded Documents</h2>
        </div>

        {documents.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No documents uploaded"
              message="Upload documents to support your loan application"
              icon="📄"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Document Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">File Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Uploaded On</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900 font-medium">
                      {getDocumentTypeLabel(doc.documentType)}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {doc.fileName || 'Document'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <DocumentStatusBadge status={doc.status} />
                    </td>
                    <td className="py-4 px-6">
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-gray-500">Uploaded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-3">Document Upload Guidelines</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li>✓ Upload clear and legible copies of all documents</li>
          <li>✓ Supported formats: PDF, JPG, PNG (Max 5 MB per file)</li>
          <li>✓ Ensure all information is visible and not cropped</li>
          <li>✓ Documents will be verified by the FPO administrator</li>
          <li>✓ You'll receive notification once verification is complete</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentsPage;
