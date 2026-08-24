import MasterPage from '../components/MasterPage';
import { Map } from 'lucide-react';

const fields = [
  { name: 'state',     label: 'State Name',   required: true },
  { name: 'zone',      label: 'Circle / Zone', type: 'select', options: ['NORTH','SOUTH','EAST','WEST'] },
  { name: 'code',      label: 'Code (2 char)', required: true },
  { name: 'statecode', label: 'State GST Code' },
  { name: 'status',    label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'state',     label: 'State' },
  { key: 'zone',      label: 'Zone' },
  { key: 'code',      label: 'Code' },
  { key: 'statecode', label: 'State Code' },
  { key: 'status',    label: 'Status' },
];

export default function StateMaster() {
  return <MasterPage title="State Master" icon={<Map size={20} />}
    apiPath="state_master" fields={fields} columns={columns} />;
}
