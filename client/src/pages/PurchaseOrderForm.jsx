import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import '../styles/erp.css';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();

  const [vendors, setVendors]       = useState([]);
  const [plants, setPlants]         = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);

  const [form, setForm] = useState({
    vendor_id: '',
    plant_id: '',
    po_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    payment_terms: '30 Days Net',
    tax_percent: 18.00,
    remarks: ''
  });

  const [lines, setLines] = useState([
    { product_id: '', item_name: '', part_code: '', qty_ordered: 1, unit_price: 0 }
  ]);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [vRes, plRes, prRes] = await Promise.all([
          fetch('/api/masters/vendor_master', { headers }).then(r => r.json()),
          fetch('/api/locations', { headers }).then(r => r.json()),
          fetch('/api/masters/product_master', { headers }).then(r => r.json())
        ]);

        if (vRes.status === 'success') setVendors(vRes.data || []);
        if (plRes.status === 'success') setPlants(plRes.data.filter(l => l.status !== 'D') || []);
        if (prRes.status === 'success') setProducts(prRes.data || []);
      } catch {
        toast.error('Failed to load masters');
      } finally {
        setLoading(false);
      }
    };
    loadMasters();
  }, []);

  const handleLineChange = (index, field, value) => {
    const next = [...lines];
    next[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find(p => String(p.id) === String(value));
      if (prod) {
        next[index].item_name = prod.product_name || '';
        next[index].part_code = prod.part_code || '';
      }
    }
    setLines(next);
  };

  const addLine = () => {
    setLines(prev => [...prev, { product_id: '', item_name: '', part_code: '', qty_ordered: 1, unit_price: 0 }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) {
      toast.error('At least one item line is required.');
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  // Compute Totals
  const subtotal = lines.reduce((acc, l) => acc + (parseFloat(l.qty_ordered || 1) * parseFloat(l.unit_price || 0)), 0);
  const taxAmount = Math.round((subtotal * (parseFloat(form.tax_percent || 18) / 100)) * 100) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor_id) {
      toast.error('Please select a Vendor');
      return;
    }
    if (lines.some(l => !l.item_name || parseFloat(l.unit_price) <= 0)) {
      toast.error('Please specify valid item name and unit price for all lines.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...form, lines })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        navigate('/procurement/purchase-orders');
      } else {
        toast.error(data.message || 'Failed to create Purchase Order');
      }
    } catch {
      toast.error('Network error creating Purchase Order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-page">
      {/* Header */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">New Purchase Order</h1>
          <p className="erp-page-sub">Generate vendor hardware purchase order with multi-item line calculations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/procurement/purchase-orders')} className="erp-btn-ghost">
            <ArrowLeft size={14} /> Back to List
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Top Header Card */}
        <div className="erp-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            1. Vendor & Receiving Plant Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label className="erp-label">Vendor / Supplier <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                className="erp-select"
                value={form.vendor_id}
                onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}
                required
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => (
                  <option key={v.sno || v.id} value={v.sno || v.id}>
                    {v.name} {v.city ? `(${v.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">Receiving Plant / Warehouse</label>
              <select
                className="erp-select"
                value={form.plant_id}
                onChange={e => setForm(f => ({ ...f, plant_id: e.target.value }))}
              >
                <option value="">-- Select Destination Plant --</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.location_name} {p.plant_code ? `(${p.plant_code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">PO Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="date"
                className="erp-input"
                value={form.po_date}
                onChange={e => setForm(f => ({ ...f, po_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="erp-label">Expected Delivery Date</label>
              <input
                type="date"
                className="erp-input"
                value={form.delivery_date}
                onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="erp-label">Payment Terms</label>
              <input
                type="text"
                className="erp-input"
                placeholder="e.g. 30 Days Net, Advance 50%"
                value={form.payment_terms}
                onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="erp-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              2. Ordered Hardware Line Items
            </h3>
            <button type="button" onClick={addLine} className="erp-btn-ghost erp-btn-sm" style={{ color: '#6366f1' }}>
              <Plus size={14} /> Add Item Line
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ minWidth: '220px' }}>Select Product / SKU</th>
                  <th style={{ minWidth: '200px' }}>Item Description</th>
                  <th style={{ width: '100px' }}>Qty</th>
                  <th style={{ width: '140px' }}>Unit Price (₹)</th>
                  <th style={{ width: '140px' }}>Line Total (₹)</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const lineTotal = (parseFloat(line.qty_ordered || 0) * parseFloat(line.unit_price || 0));
                  return (
                    <tr key={idx}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td>
                        <select
                          className="erp-select"
                          value={line.product_id}
                          onChange={e => handleLineChange(idx, 'product_id', e.target.value)}
                        >
                          <option value="">-- Custom / Pick SKU --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.product_name} {p.part_code ? `(${p.part_code})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="erp-input"
                          placeholder="e.g. Dell Latitude 5440 i7 16GB"
                          value={line.item_name}
                          onChange={e => handleLineChange(idx, 'item_name', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="erp-input"
                          min="1"
                          value={line.qty_ordered}
                          onChange={e => handleLineChange(idx, 'qty_ordered', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="erp-input"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={line.unit_price}
                          onChange={e => handleLineChange(idx, 'unit_price', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <strong>₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="erp-btn-ghost erp-btn-sm"
                          style={{ color: '#ef4444', padding: '4px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <div style={{ width: '300px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>Subtotal:</span>
                <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>GST ({form.tax_percent}%):</span>
                <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontSize: '15px' }}>
                <strong>Grand Total:</strong>
                <strong style={{ color: '#059669' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '40px' }}>
          <button type="button" onClick={() => navigate('/procurement/purchase-orders')} className="erp-btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="erp-btn-primary" style={{ padding: '10px 40px', fontSize: '14px' }}>
            <Save size={15} /> {saving ? 'Saving...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
