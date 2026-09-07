import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Package, Download } from 'lucide-react';
import { getStoreStockList } from '../api/erpApi';

export default function StoreStockList() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [pCode, setPCode] = useState('');
  const [appliedPCode, setAppliedPCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState([]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getStoreStockList({ pCode: appliedPCode, page, limit: pagination.limit });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load store stock.');
    } finally {
      setLoading(false);
    }
  }, [appliedPCode]);

  useEffect(() => { fetchData(1); }, [appliedPCode]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedCodes(data.map((r, i) => r.pCode || i));
    else setSelectedCodes([]);
  };

  const toggleSelectRow = (code) => {
    setSelectedCodes(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code]);
  };

  const handleExportCsv = (onlySelected = false) => {
    const exportData = onlySelected ? data.filter(r => selectedCodes.includes(r.pCode)) : data;
    if (exportData.length === 0) return toast.error('No data to export');
    const cols = [
      { key: 'pCode', label: 'Part Code' },
      { key: 'common', label: 'Common' },
      { key: 'user', label: 'With User' },
      { key: 'wh_mundka', label: 'WH Mundka' },
      { key: 'client', label: 'Client' },
      { key: 'store', label: 'Store' }
    ];
    const headersCsv = cols.map(c => `"${c.label}"`).join(',');
    const rowsCsv = exportData.map(row => cols.map(c => `"${(row[c.key] ?? 0).toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([headersCsv + '\n' + rowsCsv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `store_stock_${onlySelected ? 'selected_' : ''}export.csv`;
    a.click();
    toast.success(`Exported ${exportData.length} records to CSV`);
  };

  // Calculate totals
  const totals = data.reduce((acc, row) => ({
    common: acc.common + (Number(row.common) || 0),
    user: acc.user + (Number(row.user) || 0),
    wh_mundka: acc.wh_mundka + (Number(row.wh_mundka) || 0),
    client: acc.client + (Number(row.client) || 0),
    store: acc.store + (Number(row.store) || 0),
  }), { common: 0, user: 0, wh_mundka: 0, client: 0, store: 0 });

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Store Stock <span>· {pagination.total} part codes</span></span>
        <button className="btn btn-secondary" onClick={() => fetchData(pagination.page)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <div className="page-body">
        {/* Summary cards */}
        <div className="stats-row">
          {[
            { label: 'Common', val: totals.common, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'With User', val: totals.user, color: '#8b5cf6', bg: '#ede9fe' },
            { label: 'WH Mundka', val: totals.wh_mundka, color: '#06b6d4', bg: '#e0f2fe' },
            { label: 'Client', val: totals.client, color: '#ec4899', bg: '#fce7f3' },
            { label: 'Store', val: totals.store, color: '#f59e0b', bg: '#fffbeb' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <Package size={18} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>Part Code</label>
              <input type="text" className="form-control" value={pCode}
                onChange={e => setPCode(e.target.value)}
                placeholder="Search by part code"
                onKeyDown={e => e.key === 'Enter' && setAppliedPCode(pCode)} />
            </div>
            <button className="btn btn-primary" onClick={() => setAppliedPCode(pCode)}>
              <Search size={13} /> Search
            </button>
            <button className="btn btn-secondary" onClick={() => { setPCode(''); setAppliedPCode(''); }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Dynamic Action Toolbar */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-body" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div className="btn-group" style={{ flexWrap: 'wrap', gap: 6 }}>
              {selectedCodes.length > 0 ? (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleExportCsv(true)}>
                    <Download size={13} /> Export Selected ({selectedCodes.length})
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCodes([])}>
                    <X size={13} /> Deselect All
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleExportCsv(false)}>
                    <Download size={13} /> Export All CSV
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => fetchData(pagination.page)}>
                    <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
                  </button>
                </>
              )}
            </div>

            {selectedCodes.length > 0 && (
              <span className="badge badge-ack" style={{ fontSize: 12, padding: '5px 10px' }}>
                {selectedCodes.length} of {data.length} Selected
              </span>
            )}
          </div>
        </div>

        <div className="table-container">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="check-cell" style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedCodes.length === data.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>#</th>
                  <th>Part Code</th>
                  <th style={{ textAlign: 'center' }}>Common</th>
                  <th style={{ textAlign: 'center' }}>With User</th>
                  <th style={{ textAlign: 'center' }}>WH Mundka</th>
                  <th style={{ textAlign: 'center' }}>Client</th>
                  <th style={{ textAlign: 'center' }}>Store</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="loading-row"><td colSpan={9}><div className="loading-dots"><span/><span/><span/></div></td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><p>No stock data found.</p></div></td></tr>
                ) : data.map((row, idx) => {
                  const total = (Number(row.common)||0)+(Number(row.user)||0)+(Number(row.wh_mundka)||0)+(Number(row.client)||0)+(Number(row.store)||0);
                  const isSelected = selectedCodes.includes(row.pCode);
                  return (
                    <tr key={row.id || idx} className={isSelected ? 'selected' : ''}>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.pCode)}
                        />
                      </td>
                      <td style={{ color: '#94a3b8' }}>{(pagination.page-1)*pagination.limit+idx+1}</td>
                      <td><strong>{row.pCode}</strong></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>{row.common || 0}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>{row.user || 0}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#e0f2fe', color: '#075985', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>{row.wh_mundka || 0}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#fce7f3', color: '#831843', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>{row.client || 0}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#fff7ed', color: '#7c2d12', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>{row.store || 0}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{total}</td>
                    </tr>
                  );
                })}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 700, fontSize: 12 }}>
                    <td colSpan={3} style={{ padding: '8px 12px' }}>Page Totals</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>{totals.common}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>{totals.user}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>{totals.wh_mundka}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>{totals.client}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>{totals.store}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>{totals.common + totals.user + totals.wh_mundka + totals.client + totals.store}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">Page {pagination.page} of {pagination.pages}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={pagination.page<=1} onClick={()=>fetchData(pagination.page-1)}><ChevronLeft size={12}/></button>
              <button className="page-btn active">{pagination.page}</button>
              <button className="page-btn" disabled={pagination.page>=pagination.pages} onClick={()=>fetchData(pagination.page+1)}><ChevronRight size={12}/></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
