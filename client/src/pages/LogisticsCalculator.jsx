import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Calculator, Truck, MapPin, Scale, ArrowRight, CheckCircle2 } from 'lucide-react';
import { lookupPincode } from '../utils/pincodeLookup';

export default function LogisticsCalculator() {
  const [form, setForm] = useState({
    origin_pin: '110001',
    dest_pin: '400001',
    weight_kg: '2.5',
    mode: 'Surface',
    carrier: 'Blue Dart'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originInfo, setOriginInfo] = useState('New Delhi, Delhi');
  const [destInfo, setDestInfo] = useState('Mumbai, Maharashtra');

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    const clean = value.replace(/\D/g, '');
    if (clean.length === 6) {
      const res = await lookupPincode(clean);
      if (res) {
        if (name === 'origin_pin') setOriginInfo(`${res.city}, ${res.state}`);
        if (name === 'dest_pin') setDestInfo(`${res.city}, ${res.state}`);
      }
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/masters/calculate-freight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data.data);
        toast.success('Freight estimated successfully!');
      } else {
        toast.error(data.message || 'Calculation error');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fs = { padding: '8px 12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '13px', width: '100%' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calculator size={20} /> Logistics & Freight Calculator
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Input Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={16} /> Freight Estimation Parameters
          </h3>
          <form onSubmit={handleCalculate}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} /> Origin Pincode
              </label>
              <input name="origin_pin" value={form.origin_pin} onChange={handleChange} required placeholder="e.g. 110001" style={fs} />
              {originInfo && <small style={{ color: '#2563eb', display: 'block', marginTop: '3px' }}>📍 {originInfo}</small>}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} /> Destination Pincode
              </label>
              <input name="dest_pin" value={form.dest_pin} onChange={handleChange} required placeholder="e.g. 400001" style={fs} />
              {destInfo && <small style={{ color: '#2563eb', display: 'block', marginTop: '3px' }}>📍 {destInfo}</small>}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                <Scale size={13} style={{ display: 'inline', marginRight: '4px' }} /> Dead / Volumetric Weight (KG)
              </label>
              <input type="number" step="0.1" min="0.1" name="weight_kg" value={form.weight_kg} onChange={handleChange} required style={fs} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Shipping Mode</label>
              <select name="mode" value={form.mode} onChange={handleChange} style={fs}>
                <option value="Surface">Surface Cargo (Economical)</option>
                <option value="Express">Express Cargo (Priority)</option>
                <option value="Air">Air Freight (Fastest)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Preferred Carrier</label>
              <select name="carrier" value={form.carrier} onChange={handleChange} style={fs}>
                <option value="Blue Dart">Blue Dart</option>
                <option value="Delhivery">Delhivery</option>
                <option value="DTDC">DTDC</option>
                <option value="GATI-KWE">GATI-KWE</option>
                <option value="TCI Express">TCI Express</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '14px' }}>
              {loading ? 'Calculating...' : 'Calculate Estimated Freight'}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {result && (
          <div className="card" style={{ padding: '24px', background: '#fcfcfc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '16px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Freight Estimation Summary
            </h3>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>From:</span>
                <strong>{result.origin.pincode} ({result.origin.zone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>To:</span>
                <strong>{result.destination.pincode} ({result.destination.zone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>Mode & Carrier:</span>
                <strong>{result.shipping_mode} via {result.carrier}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Billable Weight:</span>
                <strong>{result.weight_kg} KG</strong>
              </div>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Basic Freight Charge:</span>
                <span>₹{result.breakdown.freightCharge.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fuel Surcharge:</span>
                <span>₹{result.breakdown.fuelSurcharge.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Handling / Docket Charge:</span>
                <span>₹{result.breakdown.handlingCharge.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST (18%):</span>
                <span>₹{result.breakdown.gst_18_percent.toFixed(2)}</span>
              </div>
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px dashed #ccc' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                <span>Total Estimated Cost:</span>
                <span>₹{result.breakdown.totalEstimatedCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
