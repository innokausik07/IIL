import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Barcode, QrCode } from 'lucide-react';
import '../styles/erp.css';

export default function PrintAssetBarcode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset]     = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/masters/asset_master`, { headers });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          const item = data.data.find(x => String(x.id) === String(id));
          setAsset(item || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  if (loading) {
    return <div className="erp-loader"><div className="erp-spinner" /></div>;
  }

  if (!asset) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Asset not found.</div>;
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* Top Action Bar */}
      <div className="no-print" style={{ maxWidth: '600px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/assets/asset-master')} className="erp-btn-ghost">
          <ArrowLeft size={14} /> Back to Assets
        </button>
        <button onClick={() => window.print()} className="erp-btn-primary" style={{ padding: '8px 24px' }}>
          <Printer size={15} /> Print Barcode Label
        </button>
      </div>

      {/* Barcode Sticker Preview (Standard 50mm x 35mm Thermal Label Size) */}
      <div style={{
        maxWidth: '420px',
        margin: '20px auto',
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        color: '#0f172a',
        fontFamily: 'Inter, monospace, sans-serif',
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ textAlign: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '6px', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
            INNOVATIVIEW INDIA PVT. LTD.
          </div>
          <div style={{ fontSize: '10px', color: '#475569' }}>PROPERTY OF ASSET RENTAL FLEET</div>
        </div>

        {/* Barcode Simulation */}
        <div style={{ textAlign: 'center', margin: '14px 0' }}>
          {/* Simulated 1D Barcode lines */}
          <div style={{
            display: 'inline-flex',
            height: '48px',
            alignItems: 'stretch',
            gap: '2px',
            background: '#fff',
            padding: '4px'
          }}>
            {[4,2,3,1,4,2,1,3,2,4,1,3,2,1,4,3,2,1,3,4,2,1,4,2,3,1,4,2,1,3,2,4,1,3].map((w, i) => (
              <div key={i} style={{ width: `${w}px`, background: '#000' }} />
            ))}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '2px', marginTop: '4px', fontFamily: 'monospace' }}>
            {asset.asset_code || 'AST-00000'}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ fontSize: '11px', background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Serial No (S/N):</span>
            <strong style={{ fontFamily: 'monospace' }}>{asset.serial_no || '—'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Model / SKU:</span>
            <strong>{asset.product_name || 'IT Hardware'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Hub / Location:</span>
            <span>{asset.location_name || 'Central WH'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Support Contact:</span>
            <span>support@innovatiview.com</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '9px', color: '#94a3b8', marginTop: '10px' }}>
          ⚠️ Tampering with or removing this asset tag is strictly prohibited.
        </div>
      </div>
    </div>
  );
}
