const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getMyDocuments,
  getLoanDocuments,
  getDocumentFile,
  getAllDocuments,
  verifyDocument,
  rejectDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { handleSingleUpload } = require('../middleware/uploadMiddleware');

// Farmer Routes
router.post('/upload', protect, authorize('FARMER'), handleSingleUpload('file'), uploadDocument);
router.get('/my', protect, authorize('FARMER'), getMyDocuments);

// Shared Route (FARMER can access own loan documents, FPO_ADMIN can access any)
router.get('/loan/:loanId', protect, authorize('FARMER', 'FPO_ADMIN'), getLoanDocuments);
router.get('/:id/file', protect, authorize('FARMER', 'FPO_ADMIN'), getDocumentFile);

// FPO Admin Routes
router.get('/', protect, authorize('FPO_ADMIN'), getAllDocuments);
router.put('/:id/verify', protect, authorize('FPO_ADMIN'), verifyDocument);
router.put('/:id/reject', protect, authorize('FPO_ADMIN'), rejectDocument);

module.exports = router;
