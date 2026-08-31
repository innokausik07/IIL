import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../styles/erp.css';

export default function ReportsAnalytics() {
  const [kpi, setKpi]               = useState(null);
  const [utilization, setUtilization] = useState({ byCategory: [], byStatus: [] });
  const [aging, setAging]           = useState([]);
  const [expiring, setExpiring]     = useState([]);
  const [revenue, setRevenue]       = useState({ billed: [], collected: [] });
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('overview');

  // Recurring run state
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating]   = useState(false);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [kRes, uRes, aRes, eRes, rRes] = await Promise.all([
        fetch('/api/reports/kpi-summary').then(r => r.json()),
        fetch('/api/reports/asset-utilization').then(r => r.json()),
        fetch('/api/reports/aging-analysis').then(r => r.json()),
        fetch('/api/reports/expiring-rentals').then(r => r.json()),
        fetch('/api/reports/revenue-trend').then(r => r.json()),
      ]);

      if (kRes.status === 'success') setKpi(kRes.data);
      if (uRes.status === 'success') setUtilization(uRes.data);
      if (aRes.status === 'success') setAging(aRes.data || []);
      if (eRes.status === 'success') setExpiring(eRes.data || []);
      if (rRes.status === 'success') setRevenue(rRes.data || { billed: [], collected: [] });
    } catch {
      toast.error('Failed to load analytics data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAllReports(); }, []);

  const handleRunRecurringBilling = async () => {
    if (!confirm(`Generate monthly rental invoices for all Active orders for month: ${targetMonth}?`)) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/finance/recurring/generate-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_month: targetMonth })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        fetchAllReports();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to generate recurring billing');
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="erp-page">
        <div className="erp-loader"><div className="erp-spinner" /></div>
      </div>
    );
  }

  const assets  = kpi?.assets || {};
  const rentals = kpi?.rentals || {};
  const finance = kpi?.finance || {};
  const tickets = kpi?.tickets || {};

  return (
    <div className="erp-page">
      {/* Header */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Executive Reports & Analytics</h1>
          <p className="erp-page-sub">Comprehensive real-time fleet utilization, MRR, aging receivables, and contracts</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="erp-btn-ghost" onClick={() => window.print()}>
            <i className="fa fa-print" /> Print Report
          </button>
          <button className="erp-btn-ghost" onClick={fetchAllReports}>
            <i className="fa fa-refresh" /> Refresh
          </button>
        </div>
      </div>

      {/* ── 1. Top Executive KPI Cards ─────────────────────────────────── */}
      <div className="erp-stat-row">
        <div className="erp-stat-card" style={{ borderLeftColor: '#6366f1' }}>
          <div className="erp-stat-val" style={{ color: '#6366f1' }}>
            {assets.total_assets || 0}
          </div>
          <div className="erp-stat-label">Total Fleet Size</div>
          <div className="erp-cell-sub">₹{Number(assets.total_inventory_value || 0).toLocaleString('en-IN')} Value</div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="erp-stat-val" style={{ color: '#10b981' }}>
            {assets.occupancy_rate || 0}%
          </div>
          <div className="erp-stat-label">Fleet Utilization</div>
          <div className="erp-cell-sub">{assets.rented_assets || 0} of {assets.total_assets || 0} Units Rented</div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="erp-stat-val" style={{ color: '#3b82f6' }}>
            ₹{Number(rentals.monthly_recurring_revenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="erp-stat-label">Monthly Recurring Revenue (MRR)</div>
          <div className="erp-cell-sub">{rentals.active_rentals || 0} Active Client Contracts</div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="erp-stat-val" style={{ color: '#f59e0b' }}>
            ₹{Number(finance.total_outstanding || 0).toLocaleString('en-IN')}
          </div>
          <div className="erp-stat-label">Total Receivables Due</div>
          <div className="erp-cell-sub" style={{ color: '#dc2626' }}>
            ₹{Number(finance.total_overdue || 0).toLocaleString('en-IN')} Overdue
          </div>
        </div>

        <div className="erp-stat-card" style={{ borderLeftColor: '#ec4899' }}>
          <div className="erp-stat-val" style={{ color: '#ec4899' }}>
            {tickets.open_tickets || 0}
          </div>
          <div className="erp-stat-label">Open Service Tickets</div>
          <div className="erp-cell-sub">{assets.maintenance_assets || 0} Units in Repair</div>
        </div>
      </div>

      {/* ── 2. Recurring Billing Trigger Banner ─────────────────────────── */}
      <div className="erp-card" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#fff', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa fa-bolt" style={{ color: '#fbbf24' }} />
              Automated Monthly Recurring Billing Engine
            </div>
            <div style={{ fontSize: '0.85rem', color: '#c7d2fe', marginTop: '4px' }}>
              Generate monthly rental invoices automatically for all Active contracts with 18% GST and 15-day payment terms.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="month"
              className="erp-input"
              style={{ background: '#fff', color: '#1e293b', width: '160px', fontWeight: 600 }}
              value={targetMonth}
              onChange={e => setTargetMonth(e.target.value)}
            />
            <button
              className="erp-btn-primary"
              style={{ background: '#4f46e5', border: '1px solid #818cf8', fontWeight: 700 }}
              onClick={handleRunRecurringBilling}
              disabled={generating}
            >
              {generating ? <><i className="fa fa-spinner fa-spin" /> Processing...</> : <><i className="fa fa-play" /> Run Billing Cycle</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Tabs Navigation ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {[
          { key: 'overview', label: 'Fleet & Status Breakdown', icon: 'fa-pie-chart' },
          { key: 'aging', label: 'Client Aging & Receivables', icon: 'fa-calendar-check-o' },
          { key: 'contracts', label: 'Contract Expirations & Renewals', icon: 'fa-handshake-o' },
          { key: 'revenue', label: 'Revenue Trends', icon: 'fa-line-chart' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 16px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: activeTab === t.key ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === t.key ? '3px solid #4f46e5' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className={`fa ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Fleet & Status Breakdown ────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Category breakdown */}
          <div className="erp-card">
            <div className="erp-card-header">
              <div className="erp-card-title">Fleet Breakdown by Category</div>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Units</th>
                  <th>Rented</th>
                  <th>Available</th>
                  <th>Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {utilization.byCategory.length === 0 ? (
                  <tr><td colSpan={5} className="erp-empty">No category data.</td></tr>
                ) : utilization.byCategory.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.category_name}</strong></td>
                    <td><span className="erp-badge erp-badge-blue">{c.total}</span></td>
                    <td><span className="erp-badge erp-badge-green">{c.rented}</span></td>
                    <td><span className="erp-badge erp-badge-grey">{c.available}</span></td>
                    <td><span className="erp-badge erp-badge-orange">{c.in_maintenance}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status breakdown */}
          <div className="erp-card">
            <div className="erp-card-header">
              <div className="erp-card-title">Assets by Lifecycle Status</div>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Asset Count</th>
                  <th>Total Cost Value</th>
                </tr>
              </thead>
              <tbody>
                {utilization.byStatus.length === 0 ? (
                  <tr><td colSpan={3} className="erp-empty">No status data.</td></tr>
                ) : utilization.byStatus.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <span className="erp-badge" style={{ background: s.color || '#888', color: '#fff' }}>
                        {s.status_name}
                      </span>
                    </td>
                    <td><strong>{s.count}</strong> units</td>
                    <td className="erp-amount">₹{Number(s.total_val || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Client Aging Matrix ─────────────────────────────────── */}
      {activeTab === 'aging' && (
        <div className="erp-card">
          <div className="erp-card-header">
            <div>
              <div className="erp-card-title">Client Receivables & Aging Buckets</div>
              <div className="erp-card-sub">Categorizes unpaid invoice balances by days past due date</div>
            </div>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Unpaid Invoices</th>
                <th>Total Balance</th>
                <th>Current (0-30d)</th>
                <th>31 - 60 Days</th>
                <th>61 - 90 Days</th>
                <th>90+ Days (Critical)</th>
              </tr>
            </thead>
            <tbody>
              {aging.length === 0 ? (
                <tr><td colSpan={7} className="erp-empty">No overdue receivables found. All accounts up to date!</td></tr>
              ) : aging.map(c => (
                <tr key={c.client_id}>
                  <td>
                    <div className="erp-cell-main">{c.client_name}</div>
                    <div className="erp-cell-sub">{c.phone || c.email || '—'}</div>
                  </td>
                  <td><span className="erp-badge erp-badge-blue">{c.total_unpaid_invoices}</span></td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>
                    ₹{Number(c.total_outstanding || 0).toLocaleString('en-IN')}
                  </td>
                  <td>₹{Number(c.bucket_0_30 || 0).toLocaleString('en-IN')}</td>
                  <td style={{ color: Number(c.bucket_31_60) > 0 ? '#d97706' : '#64748b' }}>
                    ₹{Number(c.bucket_31_60 || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: Number(c.bucket_61_90) > 0 ? '#ea580c' : '#64748b' }}>
                    ₹{Number(c.bucket_61_90 || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: Number(c.bucket_90_plus) > 0 ? '#dc2626' : '#64748b', fontWeight: Number(c.bucket_90_plus) > 0 ? 700 : 400 }}>
                    ₹{Number(c.bucket_90_plus || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab 3: Contract Expirations ─────────────────────────────────── */}
      {activeTab === 'contracts' && (
        <div className="erp-card">
          <div className="erp-card-header">
            <div>
              <div className="erp-card-title">Expiring Rental Contracts & Renewal Pipeline</div>
              <div className="erp-card-sub">Active rental orders sorted by contract expiration date</div>
            </div>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Client</th>
                <th>Contract Period</th>
                <th>Units Deployed</th>
                <th>Monthly Rate</th>
                <th>Days Remaining</th>
                <th>Action Needed</th>
              </tr>
            </thead>
            <tbody>
              {expiring.length === 0 ? (
                <tr><td colSpan={7} className="erp-empty">No active rental orders with end dates.</td></tr>
              ) : expiring.map(o => {
                const days = o.days_remaining;
                const isOverdue = days < 0;
                const isUrgent  = days >= 0 && days <= 15;
                return (
                  <tr key={o.id}>
                    <td><span className="erp-code">{o.order_no}</span></td>
                    <td>
                      <div className="erp-cell-main">{o.client_name}</div>
                      <div className="erp-cell-sub">{o.client_phone}</div>
                    </td>
                    <td>
                      {o.start_date ? o.start_date.slice(0, 10) : '—'} → <strong>{o.end_date ? o.end_date.slice(0, 10) : 'Open'}</strong>
                    </td>
                    <td><span className="erp-badge erp-badge-green">{o.total_units_deployed} units</span></td>
                    <td className="erp-amount">₹{Number(o.monthly_rental || 0).toLocaleString('en-IN')}/mo</td>
                    <td>
                      {isOverdue ? (
                        <span className="erp-badge erp-badge-red">{Math.abs(days)} days OVERDUE</span>
                      ) : isUrgent ? (
                        <span className="erp-badge erp-badge-orange">{days} days remaining</span>
                      ) : (
                        <span className="erp-badge erp-badge-blue">{days} days</span>
                      )}
                    </td>
                    <td>
                      {isOverdue || isUrgent ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626' }}>
                          <i className="fa fa-bell" style={{ marginRight: 4 }} /> Renewal / Pickup Call
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                          <i className="fa fa-check" style={{ marginRight: 4 }} /> Running
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab 4: Revenue Trends ───────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="erp-card">
            <div className="erp-card-header"><div className="erp-card-title">Monthly Billed Revenue (Last 6 Months)</div></div>
            <table className="erp-table">
              <thead><tr><th>Month</th><th>Billed Total</th></tr></thead>
              <tbody>
                {revenue.billed.length === 0 ? (
                  <tr><td colSpan={2} className="erp-empty">No billing history found.</td></tr>
                ) : revenue.billed.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.month_label}</strong></td>
                    <td className="erp-amount">₹{Number(b.total_billed || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="erp-card">
            <div className="erp-card-header"><div className="erp-card-title">Monthly Collections Received</div></div>
            <table className="erp-table">
              <thead><tr><th>Month</th><th>Collected Total</th></tr></thead>
              <tbody>
                {revenue.collected.length === 0 ? (
                  <tr><td colSpan={2} className="erp-empty">No payment records found.</td></tr>
                ) : revenue.collected.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.month_label}</strong></td>
                    <td style={{ color: '#16a34a', fontWeight: 700 }}>₹{Number(c.total_collected || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
