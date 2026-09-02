import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Truck } from 'lucide-react';
import '../styles/erp.css';

export default function PrintDeliveryChallan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dc, setDc] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const fetchDc = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/masters/delivery_challan', { headers });
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
    return <div style={{ padding: '40px', textAlign: 'center' }}>Delivery Challan not found.</div>;
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* Action Bar */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/logistics/delivery-challan')} className="erp-btn-ghost">
          <ArrowLeft size={14} /> Back to Delivery Challans
        </button>
        <button onClick={() => window.print()} className="erp-btn-primary" style={{ padding: '8px 24px' }}>
          <Printer size={15} /> Print Gate Pass / PDF
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
              Central Logistics, Warehouse & Outward Dispatch Cell
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              GSTIN: 19AAACI1234F1Z5 | CIN: U72900WB2015PTC208123
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>
              DELIVERY CHALLAN / GATE PASS
            </span>
            <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
              {dc.dc_no}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Date: {dc.dc_date ? new Date(dc.dc_date).toLocaleDateString('en-IN') : '—'}
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              DISPATCH FROM (ORIGIN):
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{dc.from_location || 'Kolkata Central Warehouse (MWH)'}</div>
            <div style={{ fontSize: '11.5px', color: '#475569' }}>Nature of Outward: Equipment Rental Delivery</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              DELIVER TO (DESTINATION):
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>{dc.client_name}</div>
            <div style={{ fontSize: '11.5px', color: '#475569' }}>Destination Site: {dc.to_location || 'Client Office Location'}</div>
          </div>
        </div>

        {/* Transit & Courier Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px', fontSize: '11.5px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <div style={{ color: '#64748b' }}>Courier Carrier:</div>
            <strong>{dc.courier_name || 'Direct Vehicle / Internal'}</strong>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>Docket / AWB No:</div>
            <strong style={{ fontFamily: 'monospace' }}>{dc.docket_no || 'DOK-001'}</strong>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>Total Quantity:</div>
            <strong>{dc.total_qty || 1} Box(es) / Units</strong>
          </div>
          <div>
            <div style={{ color: '#64748b' }}>Total Gross Weight:</div>
            <strong>{dc.total_weight ? `${dc.total_weight} KG` : 'Standard'}</strong>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '40px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description / Hardware Units</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '100px' }}>Quantity</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>1</td>
              <td style={{ padding: '10px' }}>
                <strong>IT Hardware Equipment Consignment</strong>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Ref Document: {dc.remarks || 'Standard Material Outward'}</div>
              </td>
              <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{dc.total_qty || 1} Pcs</td>
              <td style={{ padding: '10px' }}>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                  Tested & Sealed
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures & Security Gate Pass */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '60px', textAlign: 'center', fontSize: '11.5px' }}>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
            <div style={{ fontWeight: 700 }}>Dispatched By</div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '28px' }}>Warehouse Custodian</div>
          </div>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
            <div style={{ fontWeight: 700 }}>Security Gate Pass Out</div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '28px' }}>Security Officer / Seal</div>
          </div>
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
            <div style={{ fontWeight: 700 }}>Received in Good Condition</div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '28px' }}>Client Signature & Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
