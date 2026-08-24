import MasterPage from '../components/MasterPage';
import { Briefcase } from 'lucide-react';

const fields = [
  { name: 'client_name',    label: 'Client / Company Name', required: true },
  { name: 'client_code',    label: 'Client Code' },
  { name: 'contact_person', label: 'Contact Person' },
  { name: 'phone',          label: 'Phone No.' },
  { name: 'email',          label: 'Email ID', type: 'email' },
  { name: 'city',           label: 'City' },
  { name: 'state',          label: 'State' },
  { name: 'gstin',          label: 'GSTIN' },
  { name: 'address',        label: 'Address', type: 'textarea' },
  { name: 'status',         label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'client_name',    label: 'Client Name' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'phone',          label: 'Phone' },
  { key: 'city',           label: 'City' },
  { key: 'gstin',          label: 'GSTIN' },
  { key: 'status',         label: 'Status' },
];

export default function ClientMaster() {
  return <MasterPage title="Client Master" icon={<Briefcase size={20} />}
    apiPath="client_master" fields={fields} columns={columns} />;
}
