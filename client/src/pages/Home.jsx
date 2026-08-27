import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, ArrowRight, FileSpreadsheet, Users, Truck,
  Layers, Package, Building2, Sparkles, Activity
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userName = user?.full_name || user?.userid || 'User';

  return (
    <div className="page-body" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Welcome Hero Card ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '12px', padding: '48px 40px', color: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle background decorative shapes */}
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '720px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#93c5fd',
            marginBottom: '16px', fontWeight: '600'
          }}>
            <Sparkles size={13} color="#60a5fa" /> Innovatiview ERP Portal
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
            Welcome to Innovatiview
          </h1>

          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: '1.6' }}>
            Hello <strong style={{ color: '#ffffff' }}>{userName}</strong>! Welcome to the Innovatiview Enterprise Resource Management portal. Manage your operations, logistics, audit tracking, and users seamlessly.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/audit/cctv-audit')}
              className="btn btn-primary"
              style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={15} /> Go to CCTV Audit Data <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/admin/user-master')}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              <Users size={14} /> User Master
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Access Operations Grid ─────────────────────────────── */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Quick Navigation Shortcuts
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            { title: 'CCTV Audit Data', desc: 'Manage exam CCTV audits & data', path: '/audit/cctv-audit', icon: <FileSpreadsheet color="#3b82f6" /> },
            { title: 'Store Stock Sheet', desc: 'Warehouse & location inventory', path: '/store-stock', icon: <Layers color="#8b5cf6" /> },
            { title: 'Freight Calculator', desc: 'Estimate logistics & carrier freight', path: '/logistics/calculator', icon: <Truck color="#10b981" /> },
            { title: 'User Master', desc: 'Administer user accounts & rights', path: '/admin/user-master', icon: <Users color="#f59e0b" /> },
            { title: 'Location Master', desc: 'Warehouses, hubs & client locations', path: '/admin/location-master', icon: <Building2 color="#06b6d4" /> },
            { title: 'Vendor Master', desc: 'Vendor directory & details', path: '/vendors/vendor-master', icon: <Package color="#ec4899" /> },
          ].map(m => (
            <div
              key={m.title}
              onClick={() => navigate(m.path)}
              style={{
                border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px',
                cursor: 'pointer', background: '#fafbfc', transition: 'all 0.15s ease',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fafbfc'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.icon}
                </div>
                <ArrowRight size={14} color="#94a3b8" />
              </div>
              <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{m.title}</strong>
              <small style={{ color: '#64748b', fontSize: '11.5px' }}>{m.desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
