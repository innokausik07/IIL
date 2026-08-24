import MasterPage from '../components/MasterPage';
import { Users2 } from 'lucide-react';

const fields = [
  { name: 'name',            label: 'Vendor / Org Name', required: true },
  { name: 'type',            label: 'Vendor Type', type: 'select', options: ['DOMESTIC', 'IMPORT', 'SERVICE'] },
  { name: 'contact_name',    label: 'Contact Person' },
  { name: 'phone',           label: 'Phone No.' },
  { name: 'email',           label: 'Email', type: 'email' },
  { name: 'city',            label: 'City' },
  { name: 'state',           label: 'State' },
  { name: 'gstin_no',        label: 'GSTIN' },
  { name: 'payment_terms',   label: 'Payment Terms' },
  { name: 'bank',            label: 'Bank Name' },
  { name: 'acct_number',     label: 'Account Number' },
  { name: 'ifsc',            label: 'IFSC Code' },
  { name: 'address',         label: 'Address', type: 'textarea' },
  { name: 'status',          label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'name',         label: 'Vendor Name' },
  { key: 'contact_name', label: 'Contact' },
  { key: 'phone',        label: 'Phone' },
  { key: 'city',         label: 'City' },
  { key: 'gstin_no',     label: 'GSTIN' },
  { key: 'status',       label: 'Status' },
];

export default function VendorMaster() {
  return <MasterPage title="Vendor Master" icon={<Users2 size={20} />}
    apiPath="vendor_master" fields={fields} columns={columns} />;
}
