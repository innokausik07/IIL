import MasterPage from '../components/MasterPage';
import { DownloadCloud } from 'lucide-react';

const fields = [
  { name: 'grn_no',         label: 'GRN Number',          required: true },
  { name: 'grn_date',       label: 'GRN Date',            type: 'date' },
  { name: 'vendor_name',    label: 'Vendor / Supplier',   required: true },
  { name: 'po_no',          label: 'PO / Ref Number' },
  { name: 'invoice_no',     label: 'Vendor Invoice No.' },
  { name: 'warehouse_name', label: 'Receiving Warehouse' },
  { name: 'received_qty',   label: 'Received Qty' },
  { name: 'accepted_qty',   label: 'Accepted / QC Passed' },
  { name: 'rejected_qty',   label: 'Rejected Qty' },
  { name: 'status',         label: 'Status',              type: 'select', default: 'Verified',
    options: ['Pending QC', 'Verified', 'Partially Accepted', 'Rejected'] },
  { name: 'remarks',        label: 'Inspection Remarks',  type: 'textarea' },
];

const columns = [
  { key: 'grn_no',         label: 'GRN No.' },
  { key: 'grn_date',       label: 'Date' },
  { key: 'vendor_name',    label: 'Vendor' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'received_qty',   label: 'Received' },
  { key: 'accepted_qty',   label: 'Accepted' },
  { key: 'status',         label: 'Status' },
];

export default function GrnMaster() {
  return <MasterPage title="Goods Receipt Note (GRN / Inward)" icon={<DownloadCloud size={20} />}
    apiPath="goods_receipt_note" fields={fields} columns={columns} />;
}
