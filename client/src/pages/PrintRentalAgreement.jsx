import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import '../styles/erp.css';

export default function PrintRentalAgreement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rental/orders/${id}`, { headers });
        const data = await res.json();
        if (data.status === 'success') {
          setOrder(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="erp-loader"><div className="erp-spinner" /></div>;
  }

  if (!order) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Rental Order not found.</div>;
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* Print Action Bar (Hidden during print) */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(`/rental/orders/${id}`)} className="erp-btn-ghost">
          <ArrowLeft size={14} /> Back to Order
        </button>
        <button onClick={() => window.print()} className="erp-btn-primary" style={{ padding: '8px 24px' }}>
          <Printer size={15} /> Print Agreement / Save as PDF
        </button>
      </div>

      {/* A4 Printable Sheet */}
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
        {/* Header / Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a', letterSpacing: '-0.5px' }}>
              INNOVATIVIEW INDIA PRIVATE LIMITED
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
              Corporate IT Infrastructure & Equipment Rental Services
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              Regd. Office: Kolkata / New Delhi, India | GSTIN: 19AAACI1234F1Z5
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>
              Rental Agreement
            </span>
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
              {order.order_no}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Date: {order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : '—'}
            </div>
          </div>
        </div>

        {/* Parties Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              LESSOR (Service Provider):
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>Innovatiview India Pvt. Ltd.</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Fulfillment Hub: {order.delivery_location || 'Kolkata Central Warehouse'}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Contact: support@innovatiview.com</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              LESSEE (Corporate Client):
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>{order.client_name}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Phone: {order.client_phone || '—'}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Delivery Address: {order.delivery_address || 'As per Purchase Contract'}</div>
          </div>
        </div>

        {/* Contract Schedule */}
        <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '10px' }}>
          1. Rental Schedule & Commercials
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Item / Model Description</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Tenure</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Monthly Rate (₹)</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Monthly Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines || []).map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px' }}>
                  <strong>{l.product_name}</strong>
                  {l.part_code && <span style={{ color: '#64748b', fontSize: '11px' }}> ({l.part_code})</span>}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{l.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{order.duration_months} Months</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>₹{parseFloat(l.unit_monthly_rent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>₹{parseFloat(l.total_monthly_rent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Allocated Serial Numbers Table */}
        <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '10px' }}>
          2. Serialized Physical Equipment Schedule
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '11.5px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '6px', textAlign: 'left' }}>Asset Tag</th>
              <th style={{ padding: '6px', textAlign: 'left' }}>Hardware Serial No (S/N)</th>
              <th style={{ padding: '6px', textAlign: 'left' }}>Model / Specs</th>
              <th style={{ padding: '6px', textAlign: 'center' }}>Condition Handed Over</th>
            </tr>
          </thead>
          <tbody>
            {(order.allocations || []).length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                  Hardware units will be tagged upon warehouse dispatch gate-pass.
                </td>
              </tr>
            ) : (
              (order.allocations || []).map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px', fontWeight: 700, fontFamily: 'monospace' }}>{a.asset_code}</td>
                  <td style={{ padding: '6px', fontFamily: 'monospace' }}>{a.serial_no}</td>
                  <td style={{ padding: '6px' }}>{a.product_name}</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                      {a.condition_handed || 'Brand New / Excellent'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Standard Terms */}
        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5, marginBottom: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <strong>Key Terms & Conditions:</strong>
          <ol style={{ paddingLeft: '18px', margin: '6px 0 0' }}>
            <li>The equipment remains the sole property of Innovatiview India Pvt. Ltd. at all times.</li>
            <li>Monthly rental invoices are billed in advance with a 15-day payment credit period.</li>
            <li>Lessee is responsible for standard custodial care; breakdown tickets will be attended by Innovatiview technicians under standard SLA.</li>
            <li>Security deposit of ₹{parseFloat(order.security_deposit || 0).toLocaleString('en-IN')} is refundable upon safe return and inspection.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', marginTop: '40px' }}>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '12px' }}>For Innovatiview India Pvt. Ltd.</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '36px' }}>Authorized Signatory</div>
          </div>

          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '12px' }}>For {order.client_name}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '36px' }}>Authorized Signatory / Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
