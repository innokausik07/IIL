import MasterPage from '../components/MasterPage';
import { GitMerge } from 'lucide-react';

const fields = [
  { name: 'function_id', label: 'Parent Function (e.g. FN01)', required: true },
  { name: 'sub_name',    label: 'Sub-Module Name',             required: true },
  { name: 'sub_seq',     label: 'Sequence No. (sub_seq)',      default: '0' },
  { name: 'file_name',   label: 'Page Route / File Name (e.g. /logistics/calculator)' },
  { name: 'tab',         label: 'Tab Name' },
  { name: 'icon_img',    label: 'Icon Class (e.g. fa-list)' },
  { name: 'utype',       label: 'User Type (utype)',           default: '2' },
  { name: 'status',      label: 'Status', type: 'select', default: 'Y',
    options: [{ value: 'Y', label: 'Active (Y)' }, { value: 'N', label: 'Inactive (N)' }] },
];

const columns = [
  { key: 'function_id', label: 'Function' },
  { key: 'sub_name',    label: 'Sub-Module Name' },
  { key: 'sub_seq',     label: 'Seq' },
  { key: 'file_name',   label: 'Route / Path' },
  { key: 'icon_img',    label: 'Icon' },
  { key: 'status',      label: 'Status' },
  { key: 'utype',       label: 'Utype' },
];

export default function SubFunctionMaster() {
  return <MasterPage title="Sub-Function Master (Sub-Modules)" icon={<GitMerge size={20} />}
    apiPath="sub_function_master" fields={fields} columns={columns} />;
}
