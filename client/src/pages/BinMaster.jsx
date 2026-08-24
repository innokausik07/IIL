import MasterPage from '../components/MasterPage';
import { Archive } from 'lucide-react';

const fields = [
  { name: 'bin_name',      label: 'Bin Name / Number', required: true },
  { name: 'warehouse',     label: 'Warehouse Code/Name' },
  { name: 'location_name', label: 'Rack / Location' },
  { name: 'status',        label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'bin_name',      label: 'Bin Name' },
  { key: 'warehouse',     label: 'Warehouse' },
  { key: 'location_name', label: 'Location' },
  { key: 'status',        label: 'Status' },
];

export default function BinMaster() {
  return <MasterPage title="Bin Master" icon={<Archive size={20} />}
    apiPath="bin_master" fields={fields} columns={columns} />;
}
