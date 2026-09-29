import MasterPage from '../components/MasterPage';
import { Layers } from 'lucide-react';

const fields = [
  { name: 'material_type', label: 'Material Type', required: true },
  { name: 'description',   label: 'Description' },
  { name: 'status',        label: 'Status', type: 'select', default: 'Active',
    options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
];

const columns = [
  { key: 'material_type', label: 'Material Type' },
  { key: 'description',   label: 'Description' },
  { key: 'status',        label: 'Status' },
];

export default function MaterialTypeMaster() {
  return <MasterPage title="Material Type Master" icon={<Layers size={20} />}
    apiPath="material_type_master" fields={fields} columns={columns} />;
}
