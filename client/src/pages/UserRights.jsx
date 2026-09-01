import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Save, CheckSquare, Square, RefreshCw, Folder } from 'lucide-react';

export default function UserRights() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [subFunctions, setSubFunctions] = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  const fetchRights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}/rights`, { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setUser(data.data.user);
        setFunctions(data.data.functions || []);
        setSubFunctions(data.data.subFunctions || []);
        setSelectedSubIds(new Set(data.data.assignedIds || []));
      } else {
        toast.error(data.message || 'Failed to load user rights');
      }
    } catch (err) {
      toast.error('Network error loading rights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRights();
  }, [id]);

  // Toggle single sub-function checkbox
  const toggleSubRight = (subId) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  // Toggle all sub-functions in a specific module
  const toggleFunctionGroup = (fnId) => {
    const fnSubs = subFunctions.filter(s => s.function_id === fnId).map(s => s.id);
    const allSelected = fnSubs.every(subId => selectedSubIds.has(subId));

    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        fnSubs.forEach(subId => next.delete(subId));
      } else {
        fnSubs.forEach(subId => next.add(subId));
      }
      return next;
    });
  };

  // Global Select / Deselect All
  const handleSelectAll = (select) => {
    if (select) {
      const allIds = subFunctions.map(s => s.id);
      setSelectedSubIds(new Set(allIds));
    } else {
      setSelectedSubIds(new Set());
    }
  };

  // Save to access_function table
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${id}/rights`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ subFunctionIds: Array.from(selectedSubIds) })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || 'Access rights updated successfully!');
        window.dispatchEvent(new Event('rights-updated'));
        navigate(`/admin/user-master/edit/${id}`);
      } else {
        toast.error(data.message || 'Failed to save rights');
      }
    } catch (err) {
      toast.error('Network error while saving rights');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-body" style={{ textAlign: 'center', padding: '80px' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
        <p style={{ color: '#64748b' }}>Loading User Rights...</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <span className="topbar-title">Update User Rights</span>
          <span style={{ marginLeft: 8, fontSize: 13, color: '#64748b' }}>
            {user?.full_name} ({user?.emp_id || `USR_${id}`})
          </span>
        </div>
        <div className="topbar-actions">
          <button
            onClick={() => navigate(`/admin/user-master/edit/${id}`)}
            className="btn btn-secondary"
          >
            <ArrowLeft size={14} /> Back to User Form
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="btn btn-primary"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Rights'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* ── Quick Role / Type Presets Bar ─────────────────────────── */}
        <div className="card" style={{ marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚡ Quick Role Presets (1-Click Apply to Form)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => handleSelectAll(true)}
              >
                🛡️ Super Admin (Full)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => {
                  const techNames = ['Service Tickets', 'Asset Master', 'Support & Query Tickets', 'Customer Service Desk', 'Repair & Breakdown Tickets'];
                  const matched = subFunctions.filter(s => techNames.some(tn => s.sub_name.toLowerCase().includes(tn.toLowerCase()))).map(s => s.id);
                  setSelectedSubIds(new Set(matched));
                  toast.success('Applied Technician preset!');
                }}
              >
                🔧 Technician / Support
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => {
                  const salesNames = ['Lead Management', 'Quotation Management', 'RFP / Tender Management', 'Client Master', 'Rental Orders', 'New Rental Order', 'Rental Plans & Pricing', 'Sales Pipeline & Leads'];
                  const matched = subFunctions.filter(s => salesNames.some(tn => s.sub_name.toLowerCase().includes(tn.toLowerCase()))).map(s => s.id);
                  setSelectedSubIds(new Set(matched));
                  toast.success('Applied Sales & CRM preset!');
                }}
              >
                💼 Sales & CRM
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => {
                  const finNames = ['Invoice Management', 'Invoice & Payment Tracker', 'Executive Analytics', 'Client Master', 'Tax / HSN Master'];
                  const matched = subFunctions.filter(s => finNames.some(tn => s.sub_name.toLowerCase().includes(tn.toLowerCase()))).map(s => s.id);
                  setSelectedSubIds(new Set(matched));
                  toast.success('Applied Finance & Accounts preset!');
                }}
              >
                💰 Finance & Accounts
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => {
                  const whNames = ['Asset Master', 'Store Stock Sheet', 'GRN Inward Goods', 'GRN Inward Receipt', 'Delivery Challan (DC)', 'Return DC', 'Product / Item Master', 'Category Master', 'Sub-Category Master', 'BOM Master'];
                  const matched = subFunctions.filter(s => whNames.some(tn => s.sub_name.toLowerCase().includes(tn.toLowerCase()))).map(s => s.id);
                  setSelectedSubIds(new Set(matched));
                  toast.success('Applied Warehouse & Inventory preset!');
                }}
              >
                📦 Warehouse & Inventory
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => {
                  const logNames = ['Freight Calculator', 'Delivery Challan (DC)', 'GRN Inward Receipt', 'Return DC', 'Shipment Tracking', 'Courier Rate Cards', 'Courier Master'];
                  const matched = subFunctions.filter(s => logNames.some(tn => s.sub_name.toLowerCase().includes(tn.toLowerCase()))).map(s => s.id);
                  setSelectedSubIds(new Set(matched));
                  toast.success('Applied Logistics preset!');
                }}
              >
                🚚 Logistics & Dispatch
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#fff' }}
                onClick={() => {
                  const opsNames = ['CCTV Audit Sheet', 'Moved Data Sheet', 'Cross Audit Sheet', 'Store Stock Sheet'];
                  const matched = subFunctions.filter(s => opsNames.some(tn => s.sub_name.toLowerCase().includes(tn.toLowerCase()))).map(s => s.id);
                  setSelectedSubIds(new Set(matched));
                  toast.success('Applied Operations & Audit preset!');
                }}
              >
                📊 Operations & Audit
              </button>
            </div>
          </div>
        </div>

        {/* ── Control Bar ────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '18px' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleSelectAll(true)}
              >
                <CheckSquare size={13} /> Select All
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectAll(false)}
              >
                <Square size={13} /> Deselect All
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchRights}
              >
                <RefreshCw size={13} /> Reload
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
              Granted: <span style={{ color: '#2563eb' }}>{selectedSubIds.size}</span> of {subFunctions.length} Sub-Modules
            </div>
          </div>
        </div>


        {/* ── Module Groups & Sub-Functions (Devsite Layout) ─────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {functions.map(fn => {
            const fnSubs = subFunctions.filter(s => s.function_id === fn.function_id);
            if (fnSubs.length === 0) return null;

            const selectedInFn = fnSubs.filter(s => selectedSubIds.has(s.id)).length;
            const isAllSelected = selectedInFn === fnSubs.length;
            const isPartial = selectedInFn > 0 && selectedInFn < fnSubs.length;

            return (
              <div key={fn.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Module Header Bar */}
                <div style={{
                  background: '#f8fafc', padding: '12px 18px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isPartial; }}
                      onChange={() => toggleFunctionGroup(fn.function_id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {fn.function_name}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                      {selectedInFn}/{fnSubs.length} granted
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFunctionGroup(fn.function_id)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {isAllSelected ? 'Deselect Module' : 'Select Module'}
                  </button>
                </div>

                {/* Sub-Functions Checkbox Grid */}
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', background: '#fff' }}>
                  {fnSubs.map(sub => {
                    const isChecked = selectedSubIds.has(sub.id);
                    return (
                      <label
                        key={sub.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
                          padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                          background: isChecked ? '#eff6ff' : '#f8fafc',
                          border: isChecked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubRight(sub.id)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span style={{ color: isChecked ? '#1e40af' : '#334155', fontWeight: isChecked ? '600' : 'normal' }}>
                          {sub.sub_name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Save Bar */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/admin/user-master/edit/${id}`)}
            style={{ padding: '10px 24px', fontSize: '13px' }}
          >
            Back to User Form
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn btn-primary"
            style={{ padding: '10px 36px', fontSize: '13px', fontWeight: '600' }}
          >
            <Save size={15} /> {saving ? 'Saving Rights...' : 'Update Rights'}
          </button>
        </div>
      </div>
    </>
  );
}
