import MasterPage from '../components/MasterPage';
import { Palette } from 'lucide-react';

const fields = [
  { name: 'color_name', label: 'Color Name', required: true },
  { name: 'color_code', label: 'Hex Code (e.g. #FF0000)' },
  { name: 'status', label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'color_name', label: 'Color Name' },
  { key: 'color_code', label: 'Hex Code' },
  { key: 'status',     label: 'Status' },
];

export default function ColorMaster() {
  return <MasterPage title="Color Master" icon={<Palette size={20} />}
    apiPath="color_master" fields={fields} columns={columns} />;
}
