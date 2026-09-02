import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, ArrowRight, FileSpreadsheet, Users, Truck,
  Layers, Package, Building2, Sparkles, Activity, Laptop,
  FileText, IndianRupee, Wrench, BarChart3, AlertTriangle, CheckCircle2
} from 'lucide-react';
import '../styles/erp.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.full_name || user?.userid || 'User';

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/kpi-summary')
      .then(r => r.json())
      .then(res => {
        if (res.status === 'success') setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const assets  = stats?.assets || {};
  const rentals = stats?.rentals || {};
  const finance = stats?.finance || {};
  const tickets = stats?.tickets || {};

  return (
    <div className="page-body" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Welcome Hero Card ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        borderRadius: '14px', padding: '36px 36px', color: '#ffffff',
        boxShadow: '0 8px 24px rgba(15,23,42,0.25)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(165,180,252,0.4)',
            padding: '4px 14px', borderRadius: '20px', fontSize: '12px', color: '#e0e7ff',
            marginBottom: '14px', fontWeight: '600'
          }}>
            <Sparkles size={13} color="#a5b4fc" /> Enterprise IT Rental & Lifecycle ERP
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Welcome back, {userName}
          </h1>

          <p style={{ fontSize: '14.5px', color: '#cbd5e1', margin: '0 0 20px 0', lineHeight: '1.5', maxWidth: '680px' }}>
            Operational overview for equipment rentals, active client deployments, fleet occupancy, revenue cycle, and technician support.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/rental/rental-orders/new')}
              className="btn btn-primary"
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', background: '#6366f1' }}
            >
              <FileText size={15} /> New Rental Order <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/procurement/purchase-orders/new')}
              className="btn btn-secondary"
              style={{ padding: '9px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Package size={15} /> + Create PO
            </button>
            <button
              onClick={() => navigate('/assets/asset-master')}
              className="btn btn-secondary"
              style={{ padding: '9px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Laptop size={15} /> Manage Fleet
            </button>
            <button
              onClick={() => navigate('/reports/analytics')}
              className="btn btn-secondary"
              style={{ padding: '9px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BarChart3 size={15} /> Executive Reports
            </button>
          </div>
        </div>
      </div>

      {/* ── Real-Time Operational KPI Grid ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div className="erp-stat-card" style={{ borderLeftColor: '#6366f1', cursor: 'pointer' }} onClick={() => navigate('/assets/asset-master')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="erp-stat-val" style={{ color: '#6366f1' }}>{assets.total_assets || 0}</div>
            <Laptop size={20} color="#6366f1" />
          </div>
          <div className="erp-stat-label">Total Fleet Units</div>
          <div className="erp-cell-sub">{assets.rented_assets || 0} deployed ({assets.occupancy_rate || 0}% occupancy)</div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#10b981', cursor: 'pointer' }} onClick={() => navigate('/rental/rental-orders')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="erp-stat-val" style={{ color: '#10b981' }}>{rentals.active_rentals || 0}</div>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div className="erp-stat-label">Active Rental Orders</div>
          <div className="erp-cell-sub">MRR: ₹{Number(rentals.monthly_recurring_revenue || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#f59e0b', cursor: 'pointer' }} onClick={() => navigate('/finance/invoices')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="erp-stat-val" style={{ color: '#f59e0b' }}>
              ₹{Number(finance.total_outstanding || 0).toLocaleString('en-IN')}
            </div>
            <IndianRupee size={20} color="#f59e0b" />
          </div>
          <div className="erp-stat-label">Receivables Outstanding</div>
          <div className="erp-cell-sub" style={{ color: '#dc2626' }}>
            ₹{Number(finance.total_overdue || 0).toLocaleString('en-IN')} Overdue
          </div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#ec4899', cursor: 'pointer' }} onClick={() => navigate('/maintenance/tickets')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="erp-stat-val" style={{ color: '#ec4899' }}>{tickets.open_tickets || 0}</div>
            <Wrench size={20} color="#ec4899" />
          </div>
          <div className="erp-stat-label">Open Service Tickets</div>
          <div className="erp-cell-sub">{assets.maintenance_assets || 0} units in maintenance</div>
        </div>
      </div>

      {/* ── ERP Core Modules Navigation ──────────────────────────────── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ERP Operations & Command Center
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
          {[
            { title: 'Asset Fleet Master', desc: 'Hardware fleet, serial numbers & barcode tagging', path: '/assets/asset-master', icon: <Laptop color="#6366f1" size={18} /> },
            { title: 'Rental Orders & Contracts', desc: 'Order lifecycle, serial allocation & printable agreement', path: '/rental/rental-orders', icon: <FileText color="#3b82f6" size={18} /> },
            { title: 'Procurement & POs', desc: 'Vendor orders, line calculations & approval flow', path: '/procurement/purchase-orders', icon: <Package color="#8b5cf6" size={18} /> },
            { title: 'Invoice & GST Billing', desc: 'Tax Invoices, CGST/SGST breakdown & NEFT receipts', path: '/finance/invoices', icon: <IndianRupee color="#10b981" size={18} /> },
            { title: 'Service & Maintenance', desc: 'Breakdown tickets, engineer assignment & repair logs', path: '/maintenance/tickets', icon: <Wrench color="#ec4899" size={18} /> },
            { title: 'Executive Analytics', desc: 'Fleet occupancy, MRR & receivables aging matrix', path: '/reports/analytics', icon: <BarChart3 color="#f59e0b" size={18} /> },
            { title: 'Client Master', desc: 'Client accounts, credit limits & GSTIN mapping', path: '/crm/client-master', icon: <Users color="#06b6d4" size={18} /> },
            { title: 'Plant & Location Tree', desc: 'Head office, mother/child warehouses & repair centers', path: '/admin/location-master', icon: <Building2 color="#64748b" size={18} /> },
            { title: 'User-Type Rights', desc: '1-Click permission sync across roles and designations', path: '/admin/usertype-rights', icon: <ShieldCheck color="#2563eb" size={18} /> },
            { title: 'Delivery Challan & Gate Pass', desc: 'Shipping logistics, vehicle gate pass & AWB tracking', path: '/logistics/delivery-challan', icon: <Truck color="#14b8a6" size={18} /> },
            { title: 'Rental Plans & Pricing', desc: 'Tenure pricing, deposit rules & asset categories', path: '/rental/rental-plans', icon: <Layers color="#8b5cf6" size={18} /> },
            { title: 'CCTV Audit Sheet', desc: 'Exam center CCTV surveillance and operational audit', path: '/audit/cctv-audit', icon: <FileSpreadsheet color="#3b82f6" size={18} /> },
          ].map(m => (

            <div
              key={m.title}
              onClick={() => navigate(m.path)}
              style={{
                border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px',
                cursor: 'pointer', background: '#fafbfc', transition: 'all 0.15s ease',
                display: 'flex', flexDirection: 'column', gap: '6px'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
