import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Undo2 } from 'lucide-react';
import '../styles/erp.css';

export default function PrintReturnDc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dc, setDc]           = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const fetchDc = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/masters/return_dc_master', { headers });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          const item = data.data.find(x => String(x.id) === String(id));
          setDc(item || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDc();
  }, [id]);

  if (loading) {
    return <div className="erp-loader"><div className="erp-spinner" /></div>;
  }

  if (!dc) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Return Delivery Challan not found.</div>;
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* Action Bar */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/logistics/return-dc')} className="erp-btn-ghost">
          <ArrowLeft size={14} /> Back to Return DCs
        </button>
        <button onClick={() => window.print()} className="erp-btn-primary" style={{ padding: '8px 24px' }}>
          <Printer size={15} /> Print Gate-In Pass / PDF
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
              Reverse Logistics, Return Inward & Technical Inspection Hub
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              GSTIN: 19AAACI1234F1Z5 | CIN: U72900WB2015PTC208123
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#dc2626', color: '#fff', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>
              RETURN DC / GATE-IN PASS
            </span>
            <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
              {dc.return_dc_no}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Date: {dc.return_date ? new Date(dc.return_date).toLocaleDateString('en-IN') : '—'}
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              PICKUP FROM (CLIENT / SITE):
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e40af' }}>{dc.client_name}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Origin Site: {dc.from_city || 'Client Premises'}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Return Reason: <strong style={{ color: '#d97706' }}>{dc.reason || 'Rental Return'}</strong></div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              RECEIVING WAREHOUSE HUB:
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{dc.to_warehouse || 'Kolkata Central Warehouse (MWH)'}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Courier Partner: {dc.courier_name || 'Direct Reverse Logistics'}</div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Docket No: <strong style={{ fontFamily: 'monospace' }}>{dc.docket_no || 'DOK-RTN-001'}</strong></div>
          </div>
        </div>

        {/* Table of Consignment */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '40px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Returned Equipment Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '110px' }}>Inspection Status</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>QC Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>1</td>
              <td style={{ padding: '10px' }}>
                <strong>Hardware Return Consignment</strong>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Reason: {dc.reason || 'Standard Rental Return'}</div>
              </td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                  {dc.status || 'Received at WH'}
                </span>
              </td>
              <td style={{ padding: '10px', color: '#475569' }}>
                Physical inspection and functional testing verification.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Security and QC Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '60px', textAlign: 'center', fontSize: '11.5px' }}>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
            <div style={{ fontWeight: 700 }}>Security Inward Gate Pass</div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '28px' }}>Security Officer / Gate In Stamp</div>
          </div>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
            <div style={{ fontWeight: 700 }}>Technical QC Engineer</div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '28px' }}>Tested & Verified Sign</div>
          </div>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
            <div style={{ fontWeight: 700 }}>Warehouse Custodian</div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '28px' }}>Stock Restored in Bin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
