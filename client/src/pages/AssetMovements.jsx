import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/erp.css';

export default function AssetMovements() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const code = searchParams.get('code');
  const nav = useNavigate();

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/masters/asset_master/${id}/movements`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'success') setMovements(data.data || []);
          else toast.error('Failed to load movements');
          setLoading(false);
        })
        .catch(() => {
          toast.error('API Error');
          setLoading(false);
        });
    }
  }, [id]);

  return (
    <div className="erp-page">
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Asset Movements</h1>
          <p className="erp-page-sub">Tracking history for Asset Code: <strong>{code}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="erp-btn-ghost" onClick={() => nav('/assets/asset-master')}>
            <i className="fa fa-arrow-left" /> Back to Assets
          </button>
        </div>
      </div>

      <div className="erp-card">
        {loading ? (
          <div className="erp-loader"><div className="erp-spinner" /></div>
        ) : movements.length === 0 ? (
          <div className="erp-empty">No movements found for this asset.</div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Movement Type</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>From Status</th>
                <th>To Status</th>
                <th>Ref Doc</th>
                <th>Moved By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td>{m.moved_at ? new Date(m.moved_at).toLocaleString('en-IN') : '—'}</td>
                  <td><strong>{m.movement_type || '—'}</strong></td>
                  <td>{m.from_loc || '—'}</td>
                  <td>{m.to_loc || '—'}</td>
                  <td>{m.from_status_name || '—'}</td>
                  <td>{m.to_status_name || '—'}</td>
                  <td>{m.ref_doc_no || '—'} {m.ref_doc_type ? `(${m.ref_doc_type})` : ''}</td>
                  <td>{m.moved_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
