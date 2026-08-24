import MasterPage from '../components/MasterPage';
import { Cpu } from 'lucide-react';

const fields = [
  { name: 'bom_no',       label: 'BOM No.',       required: true },
  { name: 'product_name', label: 'Product Name',  required: true },
  { name: 'part_code',    label: 'Part Code' },
  { name: 'subcat_name',  label: 'Sub-Category' },
  { name: 'qty',          label: 'Quantity',      default: '1' },
  { name: 'status',       label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'bom_no',       label: 'BOM No.' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'part_code',    label: 'Part Code' },
  { key: 'qty',          label: 'Qty' },
  { key: 'status',       label: 'Status' },
];

export default function BomMaster() {
  return <MasterPage title="BOM (Bill of Materials) Master" icon={<Cpu size={20} />}
    apiPath="bom_master" fields={fields} columns={columns} />;
}
