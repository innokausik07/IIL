import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Save, CheckSquare, Square, RefreshCw, Users, Zap, ArrowLeft } from 'lucide-react';
import '../styles/erp.css';

export default function UserTypeRights() {
  const navigate = useNavigate();

  const [userTypes, setUserTypes]         = useState([]);
  const [selectedUtype, setSelectedUtype] = useState('');
  const [functions, setFunctions]         = useState([]);
  const [subFunctions, setSubFunctions]   = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState(new Set());
  const [smartPresets, setSmartPresets]   = useState({});
  const [syncToUsers, setSyncToUsers]     = useState(true);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  // Fetch all user types and presets on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [utRes, pRes] = await Promise.all([
          fetch('/api/masters/usertype_master', { headers }).then(r => r.json()),
          fetch('/api/users/roles/smart-presets', { headers }).then(r => r.json())
        ]);

        if (utRes.status === 'success' && utRes.data) {
          const types = utRes.data.filter(t => t.status !== 'D');
          setUserTypes(types);
          if (types.length > 0) {
            setSelectedUtype(String(types[0].id));
          }
        }
        if (pRes.status === 'success' && pRes.data) {
          setSmartPresets(pRes.data);
        }
      } catch {
        toast.error('Failed to load user types');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch rights whenever selected user type changes
  const fetchUtypeRights = async (utypeId) => {
    if (!utypeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/usertypes/rights/${utypeId}`, { headers });
      const data = await res.json();
      if (data.status === 'success') {
        setFunctions(data.data.functions || []);
        setSubFunctions(data.data.subFunctions || []);
        setSelectedSubIds(new Set(data.data.assignedIds || []));
      } else {
        toast.error(data.message || 'Failed to load user type rights');
      }
    } catch {
      toast.error('Network error loading rights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUtype) {
      fetchUtypeRights(selectedUtype);
    }
  }, [selectedUtype]);

  // Toggle single sub-function checkbox
  const toggleSubRight = (subId) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  // Toggle entire module
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
      setSelectedSubIds(new Set(subFunctions.map(s => s.id)));
    } else {
      setSelectedSubIds(new Set());
    }
  };

  // Apply a smart preset (Admin, Tech, Sales, Finance, etc.)
  const applyPreset = (presetKey) => {
    const preset = smartPresets[presetKey];
    if (!preset) return;
    setSelectedSubIds(new Set(preset.subFunctionIds || []));
    toast.success(`Applied "${preset.name}" preset!`);
  };

  // Save to database
  const handleSave = async () => {
    if (!selectedUtype) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/usertypes/rights/${selectedUtype}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subFunctionIds: Array.from(selectedSubIds),
          syncToUsers
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message || 'User Type rights updated successfully!');
      } else {
        toast.error(data.message || 'Failed to save rights');
      }
    } catch {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const currentType = userTypes.find(t => String(t.id) === String(selectedUtype));

  return (
    <div className="erp-page">
      {/* Header */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">User-Type Rights & Permission Presets</h1>
          <p className="erp-page-sub">Configure default module access per User Type and sync across all matching employees in 1-click</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/user-master')} className="erp-btn-ghost">
            <ArrowLeft size={15} /> Back to Users
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="erp-btn-primary">
            <Save size={15} /> {saving ? 'Saving...' : 'Save & Apply Rights'}
          </button>
        </div>
      </div>

      {/* ── User Type Selector Banner ─────────────────────────────────── */}
      <div className="erp-card" style={{ padding: '16px 20px', marginBottom: '18px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Select User Type to Configure:</div>
              <select
                className="erp-select"
                style={{ width: '260px', fontWeight: 700, fontSize: '14px', marginTop: '4px', background: '#fff' }}
                value={selectedUtype}
                onChange={e => setSelectedUtype(e.target.value)}
              >
                {userTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.typename} {t.utype ? `(${t.utype})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '8px' }}>
            <input
              type="checkbox"
              checked={syncToUsers}
              onChange={e => setSyncToUsers(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
              ⚡ Automatically sync to all active users with this User Type
            </span>
          </label>
        </div>
      </div>

      {/* ── Quick Presets Bar ─────────────────────────────────────────── */}
      <div className="erp-card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} color="#f59e0b" />
          Quick Role Templates (1-Click Apply to Form)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('ADMIN')}>
            🛡️ Super Admin (Full 100%)
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('TECHNICIAN')}>
            🔧 Technician / Service
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('SALES')}>
            💼 Sales & CRM
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('FINANCE')}>
            💰 Finance & Accounts
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('WAREHOUSE')}>
            📦 Warehouse & Inventory
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('LOGISTICS')}>
            🚚 Logistics & Dispatch
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => applyPreset('AUDIT')}>
            📊 Operations & Audit
          </button>
        </div>
      </div>

      {/* ── Selection Status Toolbar ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="erp-btn-primary erp-btn-sm" onClick={() => handleSelectAll(true)}>
            Select All
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => handleSelectAll(false)}>
            Deselect All
          </button>
          <button type="button" className="erp-btn-ghost erp-btn-sm" onClick={() => fetchUtypeRights(selectedUtype)}>
            <RefreshCw size={12} /> Reload
          </button>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Granted: <span style={{ color: '#4f46e5' }}>{selectedSubIds.size}</span> of {subFunctions.length} Sub-Modules
        </div>
      </div>

      {/* ── Modules & Sub-Functions Checkboxes Grid ───────────────────── */}
      {loading ? (
        <div className="erp-loader"><div className="erp-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {functions.map(fn => {
            const fnSubs = subFunctions.filter(s => s.function_id === fn.function_id);
            if (fnSubs.length === 0) return null;

            const selectedCount = fnSubs.filter(s => selectedSubIds.has(s.id)).length;
            const isAllSelected = selectedCount === fnSubs.length;
            const isIndeterminate = selectedCount > 0 && selectedCount < fnSubs.length;

            return (
              <div key={fn.id} className="erp-card" style={{ overflow: 'hidden' }}>
                <div style={{
                  background: '#f8fafc', padding: '10px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                      onChange={() => toggleFunctionGroup(fn.function_id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{fn.function_name}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                      {selectedCount}/{fnSubs.length} granted
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFunctionGroup(fn.function_id)}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isAllSelected ? 'Deselect Module' : 'Select Module'}
                  </button>
                </div>

                <div style={{
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '10px',
                  background: '#fff'
                }}>
                  {fnSubs.map(sub => {
                    const isChecked = selectedSubIds.has(sub.id);
                    return (
                      <label
                        key={sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
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
                        <span style={{ color: isChecked ? '#1e40af' : '#334155', fontWeight: isChecked ? 600 : 'normal' }}>
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
      )}

      {/* Footer Save CTA */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button type="button" className="erp-btn-ghost" onClick={() => navigate('/admin/user-master')}>
          Back to User Master
        </button>
        <button type="button" disabled={saving} onClick={handleSave} className="erp-btn-primary" style={{ padding: '10px 36px', fontSize: '13.5px' }}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save & Sync Rights'}
        </button>
      </div>
    </div>
  );
}
