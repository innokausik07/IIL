/**
 * Lookup Indian Postal Pincode to auto-fetch City, District, State
 */
export async function lookupPincode(pincode) {
  const pin = String(pincode || '').replace(/\D/g, '').trim();
  if (pin.length !== 6) return null;

  // 1. Try local server proxy
  try {
    const res = await fetch(`/api/pincode/${pin}`);
    const data = await res.json();
    if (data.status === 'success' && data.data) {
      return {
        city: data.data.city || data.data.district || '',
        state: data.data.state || '',
        district: data.data.district || '',
        pincode: pin
      };
    }
  } catch (e) {
    // Continue to fallback
  }

  // 2. Direct India Post API Fallback
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        city: po.District || po.Block || po.Division || po.Name || '',
        state: po.State || '',
        district: po.District || '',
        pincode: pin
      };
    }
  } catch (err) {
    console.error('Pincode lookup error:', err);
  }

  return null;
}
