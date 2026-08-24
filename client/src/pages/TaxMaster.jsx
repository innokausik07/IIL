import MasterPage from '../components/MasterPage';
import { Receipt } from 'lucide-react';

const fields = [
  { name: 'hsn_code',        label: 'HSN Code',     required: true },
  { name: 'chapter_no',      label: 'Chapter No.' },
  { name: 'hsn_description', label: 'Description',  type: 'textarea' },
  { name: 'sgst',            label: 'SGST %' },
  { name: 'cgst',            label: 'CGST %' },
  { name: 'igst',            label: 'IGST %' },
  { name: 'status', label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'hsn_code',    label: 'HSN Code' },
  { key: 'chapter_no',  label: 'Chapter' },
  { key: 'sgst',        label: 'SGST %' },
  { key: 'cgst',        label: 'CGST %' },
  { key: 'igst',        label: 'IGST %' },
  { key: 'status',      label: 'Status' },
];

export default function TaxMaster() {
  return <MasterPage title="Tax / HSN Master" icon={<Receipt size={20} />}
    apiPath="tax_hsn_master" fields={fields} columns={columns} />;
}
