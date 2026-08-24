import MasterPage from '../components/MasterPage';
import { Layers } from 'lucide-react';

const fields = [
  { name: 'cat_name',   label: 'Category Name', required: true },
  { name: 'short_code', label: 'Short Code',    required: true },
  { name: 'status',     label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'cat_name',   label: 'Category Name' },
  { key: 'short_code', label: 'Short Code' },
  { key: 'status',     label: 'Status' },
];

export default function ProductCategoryMaster() {
  return <MasterPage title="Product Category Master" icon={<Layers size={20} />}
    apiPath="product_cat_master" fields={fields} columns={columns} />;
}
