import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, ArrowRight, Award, TrendingUp, Cpu, Building2,
  FileSpreadsheet, Users, Truck, Package, Layers, Activity
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ background: '#0b0f19', color: '#fff', minHeight: 'calc(100vh - 58px)', overflowX: 'hidden' }}>
      {/* ── 1. Top Enterprise Header Bar ─────────────────────────────── */}
      <div style={{
        background: '#ffffff', color: '#1e293b', padding: '14px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px', color: '#0f172a' }}>
            Innovatiview
          </div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: '#2563eb', borderLeft: '2px solid #cbd5e1', paddingLeft: '8px' }}>
            BE DISTINCT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>
          <span style={{ cursor: 'pointer', hover: { color: '#0f172a' } }}>About Us</span>
          <span style={{ cursor: 'pointer' }}>Services ▾</span>
          <span style={{ cursor: 'pointer' }}>Products ▾</span>
          <span style={{ cursor: 'pointer' }}>Press</span>
          <span style={{ cursor: 'pointer' }}>Careers</span>
          <span style={{ cursor: 'pointer' }}>Investors</span>
        </div>
      </div>

      {/* ── 2. Hero Section (Matching User Reference Image) ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', minHeight: '480px' }}>
        {/* Main Hero Banner */}
        <div style={{
          position: 'relative', padding: '60px 48px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          overflow: 'hidden', borderRight: '1px solid #334155'
        }}>
          {/* Subtle Background Glow & Grid */}
          <div style={{
            position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
            width: '320px', height: '320px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', color: '#93c5fd', marginBottom: '20px', fontWeight: '600' }}>
              <ShieldCheck size={14} color="#60a5fa" /> India's Leading Examination Security Leader
            </div>

            <h1 style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: '20px', color: '#ffffff' }}>
              Largest Player for Examination Integrated Security Solutions in India
            </h1>

            <p style={{ fontSize: '14.5px', lineHeight: '1.65', color: '#94a3b8', marginBottom: '32px', fontWeight: '400' }}>
              We are a technology-driven company providing automated ancillary security and surveillance solutions for examinations, elections, and large-scale events pan-India, with a market share of <strong style={{ color: '#60a5fa' }}>73.7%</strong> in terms of revenue in Fiscal 2024.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/audit/cctv-audit')}
                className="btn"
                style={{
                  background: 'transparent', border: '1.5px solid #ffffff', color: '#ffffff',
                  padding: '10px 24px', borderRadius: '4px', fontSize: '13px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Access ERP Operations <ArrowRight size={14} />
              </button>

              <button
                onClick={() => navigate('/audit/cctv-audit')}
                className="btn btn-primary"
                style={{
                  padding: '10px 24px', borderRadius: '4px', fontSize: '13px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <FileSpreadsheet size={14} /> CCTV Audit Data
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Cards (Customer Stories & Press Release) */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#090d16' }}>
          {/* Card 1: Customer Stories */}
          <div style={{
            flex: 1, padding: '40px 32px', borderBottom: '1px solid #1e293b',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            background: '#111827'
          }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px' }}>
              Customer Stories
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.3, color: '#f9fafb', marginBottom: '16px' }}>
              Innovatiview's Role in Large-Scale Examination Security
            </h3>
            <div
              onClick={() => navigate('/audit/cctv-audit')}
              style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              Read Case Study <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 2: Press Release */}
          <div style={{
            flex: 1, padding: '40px 32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            background: '#0d131f'
          }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px' }}>
              Press Release
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.3, color: '#f9fafb', marginBottom: '16px' }}>
              Innovatiview India Ltd. – A Great Place to Work® for Two Years in a Row
            </h3>
            <div
              onClick={() => navigate('/audit/cctv-audit')}
              style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              Learn More <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Executive Metrics & Key Highlights ────────────────────── */}
      <div style={{ padding: '36px 48px', background: '#0d131f', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { label: 'Market Share (Fiscal 2024)', value: '73.7%', icon: <TrendingUp color="#3b82f6" /> },
            { label: 'Examination Centers Secured', value: '10,000+', icon: <Building2 color="#10b981" /> },
            { label: 'Pan-India Real-Time Surveillance', value: '24/7 AI-Ops', icon: <Cpu color="#8b5cf6" /> },
            { label: 'Active Enterprise & Govt Clients', value: '500+', icon: <Award color="#f59e0b" /> },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: '500' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. ERP Quick Access Launchpad ────────────────────────────── */}
      <div style={{ padding: '32px 48px', background: '#0b0f19' }}>
        <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', marginBottom: '16px', fontWeight: '600' }}>
          Quick Enterprise Launchpad
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {[
            { label: 'CCTV Audit Data', path: '/audit/cctv-audit', icon: <FileSpreadsheet size={16} /> },
            { label: 'Store Stock Sheet', path: '/store-stock', icon: <Layers size={16} /> },
            { label: 'Freight Calculator', path: '/logistics/calculator', icon: <Truck size={16} /> },
            { label: 'User Master', path: '/admin/user-master', icon: <Users size={16} /> },
            { label: 'Location Master', path: '/admin/location-master', icon: <Building2 size={16} /> },
            { label: 'Vendor Master', path: '/vendors/vendor-master', icon: <Package size={16} /> },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                background: '#131b2e', border: '1px solid #1e293b', borderRadius: '6px',
                padding: '12px 16px', color: '#cbd5e1', fontSize: '13px', fontWeight: '500',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.icon} {item.label}
              </span>
              <ArrowRight size={13} color="#64748b" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
