import MasterPage from '../components/MasterPage';
import { DollarSign } from 'lucide-react';

const fields = [
  { name: 'courier_name',   label: 'Courier / Transporter Name', required: true },
  { name: 'mode',           label: 'Mode',                       type: 'select', options: ['Surface', 'Express', 'Air'] },
  { name: 'min_weight_kg',  label: 'Min Chargeable Weight (KG)', default: '0.5' },
  { name: 'base_rate',      label: 'Base Rate (₹)',              default: '50' },
  { name: 'per_kg_rate',    label: 'Rate / Additional KG (₹)',  default: '20' },
  { name: 'fuel_surcharge', label: 'Fuel Surcharge (%)',         default: '10' },
  { name: 'status',         label: 'Status',                     type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'courier_name',   label: 'Courier' },
  { key: 'mode',           label: 'Mode' },
  { key: 'base_rate',      label: 'Base Rate (₹)' },
  { key: 'per_kg_rate',    label: 'Rate/KG (₹)' },
  { key: 'fuel_surcharge', label: 'Fuel (%)' },
  { key: 'status',         label: 'Status' },
];

export default function CourierRateMaster() {
  return <MasterPage title="Courier Rate & Contract Master" icon={<DollarSign size={20} />}
    apiPath="courier_rate_master" fields={fields} columns={columns} />;
}
