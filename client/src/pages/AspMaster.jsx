import MasterPage from '../components/MasterPage';
import { ShieldCheck } from 'lucide-react';

const fields = [
  { name: 'asp_name',       label: 'Service Partner (ASP) Name', required: true },
  { name: 'contact_person', label: 'Contact Person' },
  { name: 'phone',          label: 'Phone No.' },
  { name: 'email',          label: 'Email ID', type: 'email' },
  { name: 'city',           label: 'City' },
  { name: 'state',          label: 'State' },
  { name: 'status',         label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'asp_name',       label: 'ASP Name' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'phone',          label: 'Phone' },
  { key: 'city',           label: 'City' },
  { key: 'status',         label: 'Status' },
];

export default function AspMaster() {
  return <MasterPage title="ASP (Authorized Partner) Master" icon={<ShieldCheck size={20} />}
    apiPath="asp_master" fields={fields} columns={columns} />;
}
