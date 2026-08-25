const express = require('express');
const router = express.Router();
const https = require('https');

// GET /api/pincode/:pincode
router.get('/:pincode', (req, res) => {
  const pincode = String(req.params.pincode || '').trim();
  if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ status: 'error', message: 'Invalid 6-digit pincode' });
  }

  const url = `https://api.postalpincode.in/pincode/${pincode}`;

  https.get(url, (apiRes) => {
    let raw = '';
    apiRes.on('data', chunk => { raw += chunk; });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed[0] && parsed[0].Status === 'Success' && parsed[0].PostOffice && parsed[0].PostOffice.length > 0) {
          const po = parsed[0].PostOffice[0];
          return res.json({
            status: 'success',
            data: {
              pincode,
              city: po.District || po.Block || po.Division || po.Name,
              district: po.District,
              state: po.State,
              region: po.Region,
              country: po.Country || 'India'
            }
          });
        } else {
          return res.status(404).json({ status: 'error', message: 'Pincode not found' });
        }
      } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Failed to parse postal API response' });
      }
    });
  }).on('error', (err) => {
    return res.status(500).json({ status: 'error', message: 'Postal API network error: ' + err.message });
  });
});

module.exports = router;
