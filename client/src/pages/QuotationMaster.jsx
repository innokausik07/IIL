import MasterPage from '../components/MasterPage';
import { FileText } from 'lucide-react';

const fields = [
  { name: 'quot_no',      label: 'Quotation No.',  required: true },
  { name: 'client_name',  label: 'Client Name',    required: true },
  { name: 'quot_date',    label: 'Quotation Date', type: 'date' },
  { name: 'total_amount', label: 'Total Amount (₹)' },
  { name: 'tax_amount',   label: 'Tax Amount (₹)' },
  { name: 'net_amount',   label: 'Net Amount (₹)' },
  { name: 'status',       label: 'Status', type: 'select', default: 'Draft',
    options: ['Draft', 'Sent', 'Approved', 'Rejected', 'Revised'] },
];

const columns = [
  { key: 'quot_no',      label: 'Quot No.' },
  { key: 'client_name',  label: 'Client' },
  { key: 'quot_date',    label: 'Date' },
  { key: 'net_amount',   label: 'Net Amount (₹)' },
  { key: 'status',       label: 'Status' },
];

export default function QuotationMaster() {
  return <MasterPage title="Quotation Management" icon={<FileText size={20} />}
    apiPath="quot_master" fields={fields} columns={columns} />;
}
