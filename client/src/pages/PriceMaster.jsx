import MasterPage from '../components/MasterPage';
import { CircleDollarSign } from 'lucide-react';

const fields = [
  { name: 'part_code',      label: 'Part Code',      required: true },
  { name: 'product_name',   label: 'Product Name' },
  { name: 'purchase_price', label: 'Purchase Price (₹)' },
  { name: 'selling_price',  label: 'Selling Price (₹)' },
  { name: 'rental_price',   label: 'Rental Price (₹)' },
  { name: 'status',         label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'part_code',      label: 'Part Code' },
  { key: 'product_name',   label: 'Product Name' },
  { key: 'purchase_price', label: 'Purchase (₹)' },
  { key: 'selling_price',  label: 'Selling (₹)' },
  { key: 'rental_price',   label: 'Rental (₹)' },
  { key: 'status',         label: 'Status' },
];

export default function PriceMaster() {
  return <MasterPage title="Price Master" icon={<CircleDollarSign size={20} />}
    apiPath="price_master" fields={fields} columns={columns} />;
}
