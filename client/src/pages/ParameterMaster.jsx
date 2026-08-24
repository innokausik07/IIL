import MasterPage from '../components/MasterPage';
import { Settings } from 'lucide-react';

const fields = [
  { name: 'param_name',  label: 'Parameter Name',  required: true },
  { name: 'param_value', label: 'Parameter Value' },
  { name: 'param_type',  label: 'Parameter Type' },
  { name: 'status', label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'param_name',  label: 'Name' },
  { key: 'param_value', label: 'Value' },
  { key: 'param_type',  label: 'Type' },
  { key: 'status',      label: 'Status' },
];

export default function ParameterMaster() {
  return <MasterPage title="Parameter Master" icon={<Settings size={20} />}
    apiPath="parameter_master" fields={fields} columns={columns} />;
}
