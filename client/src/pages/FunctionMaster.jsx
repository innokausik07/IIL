import MasterPage from '../components/MasterPage';
import { Network } from 'lucide-react';

const fields = [
  { name: 'function_id',   label: 'Function Code (e.g. FN01)', required: true },
  { name: 'function_name', label: 'Function / Module Name',    required: true },
  { name: 'descrip',       label: 'Description',               type: 'textarea' },
  { name: 'icon_img',      label: 'Icon Class (e.g. fa-truck)' },
  { name: 'utype',         label: 'User Type (utype)',         default: '2' },
  { name: 'tab',           label: 'Tab Display Order',         default: '0.00' },
  { name: 'status',        label: 'Status', type: 'select', default: 'Active',
    options: [{ value: 'Active', label: 'Active' }, { value: 'D', label: 'Deactivated (D)' }] },
];

const columns = [
  { key: 'function_id',   label: 'Function ID' },
  { key: 'function_name', label: 'Function Name' },
  { key: 'descrip',       label: 'Description' },
  { key: 'icon_img',      label: 'Icon' },
  { key: 'status',        label: 'Status' },
  { key: 'utype',         label: 'Utype' },
  { key: 'tab',           label: 'Tab Order' },
];

export default function FunctionMaster() {
  return <MasterPage title="Function Master (Main Modules)" icon={<Network size={20} />}
    apiPath="function_master" fields={fields} columns={columns} />;
}
