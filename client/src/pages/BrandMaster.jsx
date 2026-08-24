import MasterPage from '../components/MasterPage';
import { Tag } from 'lucide-react';

const fields = [
  { name: 'make',   label: 'Brand Name', required: true },
  { name: 'status', label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'make',   label: 'Brand Name' },
  { key: 'status', label: 'Status' },
];

export default function BrandMaster() {
  return <MasterPage title="Brand Master" icon={<Tag size={20} />}
    apiPath="make_master" fields={fields} columns={columns} />;
}
