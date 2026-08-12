// Maps ERP status codes to badge labels and CSS classes
// Mirrors the PHP badge logic from google_sheet_list.php
const STATUS_MAP = {
  '42':    { label: 'Created',              cls: 'badge-created' },
  'Created': { label: 'Created',            cls: 'badge-created' },
  '63':    { label: 'Assigned',             cls: 'badge-assigned' },
  'Pending to Receive': { label: 'Assigned', cls: 'badge-assigned' },
  '76':    { label: 'Work in Progress',     cls: 'badge-received' },
  'Work in Progress': { label: 'Work in Progress', cls: 'badge-received' },
  '77':    { label: 'Pending Ack',          cls: 'badge-workdone' },
  'Pending to Acknowledge': { label: 'Pending Ack', cls: 'badge-workdone' },
  '65':    { label: 'Acknowledged',         cls: 'badge-ack' },
  '78':    { label: 'Moved to Store',       cls: 'badge-moved-store' },
  'Moved to Store': { label: 'Moved to Store', cls: 'badge-moved-store' },
  '79':    { label: 'Moved to Client',      cls: 'badge-moved-client' },
  'Moved to Client': { label: 'Moved to Client', cls: 'badge-moved-client' },
  '80':    { label: 'Moved to WH',         cls: 'badge-moved-wh' },
  'Moved to WH': { label: 'Moved to WH',   cls: 'badge-moved-wh' },
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-default">—</span>;
  const info = STATUS_MAP[status] || { label: status, cls: 'badge-default' };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

export { STATUS_MAP };
