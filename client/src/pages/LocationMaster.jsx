import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Plus, RefreshCw, Search, Pencil, Ban, CheckCircle2 } from 'lucide-react';

export default function LocationMaster() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [fetching, setFetching]   = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  const fetchLocations = async () => {
    setFetching(true);
    try {
      const res  = await fetch('/api/locations', { headers });
      const data = await res.json();
      if (data.status === 'success') setLocations(data.data || []);
    } catch (e) { toast.error('Failed to load locations'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchLocations(); }, []);

  const filteredLocations = locations.filter(loc => {
    if (statusFilter !== 'ALL' && String(loc.status ?? '1') !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (loc.location_name || '').toLowerCase().includes(q) ||
      (loc.city || '').toLowerCase().includes(q) ||
      (loc.state || '').toLowerCase().includes(q) ||
      (loc.contact_person || '').toLowerCase().includes(q) ||
      (loc.contact_no || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Page Header with Add Button */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MapPin size={20} /> Location Master
        </h1>

        <button
          onClick={() => navigate('/admin/location-master/add')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', borderRadius: '4px', fontWeight: '600' }}
        >
          <Plus size={15} /> Add Location
        </button>
      </div>

      {/* ─── Clean Location Table Card ─────────────────────────── */}
      <div className="card" style={{ maxWidth: '1080px', margin: '0 auto', padding: '20px' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
              >
                <option value="ALL">All Status</option>
                <option value="1">Active Only</option>
                <option value="0">Inactive Only</option>
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search location, city, person..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '5px 10px 5px 30px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', width: '220px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Total: <strong>{filteredLocations.length}</strong>
            </span>
            <button onClick={fetchLocations} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
              <RefreshCw size={12} className={fetching ? 'spin' : ''} style={{ marginRight: '4px' }} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        {fetching ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Loading locations...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['#', 'Location Name', 'City', 'State', 'Contact Person', 'Contact No', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Status' || h === 'Actions' ? 'center' : 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                      No locations found
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((loc, i) => (
                    <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '9px 12px' }}>{i + 1}</td>
                      <td style={{ padding: '9px 12px', fontWeight: '600', color: '#1e293b' }}>{loc.location_name}</td>
                      <td style={{ padding: '9px 12px' }}>{loc.city}</td>
                      <td style={{ padding: '9px 12px' }}>{loc.state}</td>
                      <td style={{ padding: '9px 12px' }}>{loc.contact_person}</td>
                      <td style={{ padding: '9px 12px' }}>{loc.contact_no}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                          background: loc.status === '1' ? '#d4edda' : '#f8d7da',
                          color: loc.status === '1' ? '#155724' : '#721c24'
                        }}>
                          {loc.status === '1' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => navigate(`/admin/location-master/edit/${loc.id}`)}
                          title="Edit"
                          style={{
                            background: 'none', border: '1px solid #3b82f6', borderRadius: '4px',
                            color: '#3b82f6', padding: '3px 8px', marginRight: '6px', cursor: 'pointer', fontSize: '12px'
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
