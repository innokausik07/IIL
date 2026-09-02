import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, ShoppingCart } from 'lucide-react';
import '../styles/erp.css';

export default function PrintPurchaseOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo]           = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const fetchPo = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/procurement/purchase-orders/${id}`, { headers });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setPo(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPo();
  }, [id]);

  if (loading) {
    return <div className="erp-loader"><div className="erp-spinner" /></div>;
  }

  if (!po) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Purchase Order not found.</div>;
  }

  const subtotal = parseFloat(po.subtotal || 0);
  const taxAmount = parseFloat(po.tax_amount || 0);
  const totalAmount = parseFloat(po.total_amount || 0);

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* Action Bar */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/procurement/purchase-orders')} className="erp-btn-ghost">
          <ArrowLeft size={14} /> Back to Purchase Orders
        </button>
        <button onClick={() => window.print()} className="erp-btn-primary" style={{ padding: '8px 24px' }}>
          <Printer size={15} /> Print Purchase Order / PDF
        </button>
      </div>

      {/* A4 Sheet */}
      <div style={{
        maxWidth: '850px',
        margin: '0 auto',
        background: '#fff',
        padding: '48px',
        borderRadius: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        color: '#0f172a',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
              INNOVATIVIEW INDIA PRIVATE LIMITED
            </h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#475569' }}>
              Corporate Procurement & Central Supply Chain Hub
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              GSTIN: 19AAACI1234F1Z5 | PAN: AAACI1234F | Kolkata, West Bengal
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>
              PURCHASE ORDER
            </span>
            <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
              {po.po_no}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              PO Date: {po.po_date ? new Date(po.po_date).toLocaleDateString('en-IN') : '—'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Status: <strong style={{ color: po.status === 'Approved' ? '#059669' : '#d97706' }}>{po.status}</strong>
            </div>
          </div>
        </div>

        {/* Vendor & Shipping Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '24px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              VENDOR / SUPPLIER DETAILS:
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e40af' }}>{po.vendor_name}</div>
            <div style={{ fontSize: '11.5px', color: '#334155' }}>Address: {po.vendor_address || 'Registered Supplier Address'}</div>
            <div style={{ fontSize: '11.5px', color: '#334155' }}>GSTIN: {po.vendor_gstin || 'Standard Domestic Supplier'}</div>
            {po.vendor_phone && <div style={{ fontSize: '11.5px', color: '#334155' }}>Contact: {po.vendor_phone}</div>}
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              SHIP TO / RECEIVING PLANT:
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{po.plant_name || 'Kolkata Central Warehouse (MWH)'}</div>
            <div style={{ fontSize: '11.5px', color: '#334155' }}>Expected Delivery: <strong>{po.delivery_date || 'Standard SLA'}</strong></div>
            <div style={{ fontSize: '11.5px', color: '#334155' }}>Payment Terms: {po.payment_terms || '30 Days Net'}</div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '40px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description / Hardware SKU</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>Part Code</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Unit Rate (₹)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Line Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(po.lines || []).map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>{i + 1}</td>
                <td style={{ padding: '10px' }}>
                  <strong>{l.item_name}</strong>
                  {l.product_name && <div style={{ fontSize: '11px', color: '#64748b' }}>Category: {l.product_name}</div>}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>{l.part_code || '—'}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{l.qty_ordered}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(l.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(l.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '30px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              INWARD RECEIPT & TERMS INSTRUCTIONS:
            </div>
            <div>1. Delivery must include formal Tax Invoice and Delivery Challan with serial numbers.</div>
            <div>2. Physical inspection and QC check will be completed upon warehouse arrival before GRN verification.</div>
            <div>3. Inward goods must match the exact SKU specs mentioned above.</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>GST ({po.tax_percent || 18}%):</span>
              <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '14px' }}>
              <strong>Grand Total:</strong>
              <strong style={{ color: '#059669' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', maxWidth: '350px' }}>
            Prepared by: {po.created_by_name || 'Procurement Officer'}<br />
            Approved by: {po.approved_by_name || 'Authorized Commercial Signatory'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '12px' }}>For Innovatiview India Pvt. Ltd.</div>
            <div style={{ height: '40px' }} />
            <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
