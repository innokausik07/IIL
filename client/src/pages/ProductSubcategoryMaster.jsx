import MasterPage from '../components/MasterPage';
import { GitFork } from 'lucide-react';

const fields = [
  { name: 'prod_sub_cat',     label: 'Sub-Category Name', required: true },
  { name: 'product_category', label: 'Parent Category Name' },
  { name: 'productid',        label: 'Category Code/ID' },
  { name: 'status',           label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'prod_sub_cat',     label: 'Sub-Category Name' },
  { key: 'product_category', label: 'Parent Category' },
  { key: 'status',           label: 'Status' },
];

export default function ProductSubcategoryMaster() {
  return <MasterPage title="Product Sub-Category Master" icon={<GitFork size={20} />}
    apiPath="product_sub_category" fields={fields} columns={columns} />;
}
