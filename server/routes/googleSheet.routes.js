const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, csvUpload } = require('../middleware/upload');
const {
  getList, doAction, bulkAssignee, bulkAck,
  downloadTemplate, getBinsByLocation, getStats
} = require('../controllers/googleSheet.controller');

router.get('/', auth, getList);
router.get('/stats', auth, getStats);
router.get('/bins', auth, getBinsByLocation);
router.get('/template/:type', auth, downloadTemplate);

// Actions (assign, receive, work_done, acknowledgement, rollback, movement with optional file)
router.post('/action', auth, upload.single('movement_attachment'), doAction);

// Bulk CSV uploads
router.post('/bulk/assignee', auth, csvUpload.single('bulk_file'), bulkAssignee);
router.post('/bulk/ack', auth, csvUpload.single('bulk_ack_file'), bulkAck);

module.exports = router;
