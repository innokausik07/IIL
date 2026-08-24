import MasterPage from '../components/MasterPage';
import { Package } from 'lucide-react';

const fields = [
  { name: 'product_name',        label: 'Product / Item Name', required: true },
  { name: 'part_code',           label: 'Part Code (PID)' },
  { name: 'item_code',           label: 'Item Code' },
  { name: 'product_category_id', label: 'Category ID' },
  { name: 'product_subcat_id',   label: 'Sub-Category ID' },
  { name: 'brand_id',            label: 'Brand ID' },
  { name: 'model',               label: 'Model Name' },
  { name: 'hsn_code',            label: 'HSN Code' },
  { name: 'product_color',       label: 'Color' },
  { name: 'product_type',        label: 'Product Type', type: 'select', default: 'UNIT',
    options: ['UNIT', 'SPARE', 'ACCESSORY'] },
  { name: 'is_serialize',        label: 'Serialized', type: 'select', default: 'Y',
    options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }] },
  { name: 'warranty_days',       label: 'Warranty (Days)' },
  { name: 'product_description', label: 'Description', type: 'textarea' },
  { name: 'status_id',           label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'part_code',    label: 'Part Code' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'model',        label: 'Model' },
  { key: 'product_type', label: 'Type' },
  { key: 'hsn_code',     label: 'HSN' },
  { key: 'status_id',    label: 'Status' },
];

export default function ProductMaster() {
  return <MasterPage title="Product / Item Master" icon={<Package size={20} />}
    apiPath="product_master" fields={fields} columns={columns} />;
}
