import MasterPage from '../components/MasterPage';
import { Truck } from 'lucide-react';

const fields = [
  { name: 'couriername',    label: 'Courier Name',   required: true },
  { name: 'couriercode',    label: 'Courier Code' },
  { name: 'contact_person', label: 'Contact Person' },
  { name: 'email',          label: 'Email', type: 'email' },
  { name: 'phone',          label: 'Phone' },
  { name: 'addrs',          label: 'Address', type: 'textarea' },
  { name: 'city',           label: 'City' },
  { name: 'state',          label: 'State' },
  { name: 'gstin',          label: 'GSTIN' },
  { name: 'status', label: 'Status', type: 'select', default: '1',
    options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
];

const columns = [
  { key: 'couriername',    label: 'Courier Name' },
  { key: 'couriercode',    label: 'Code' },
  { key: 'contact_person', label: 'Contact' },
  { key: 'phone',          label: 'Phone' },
  { key: 'city',           label: 'City' },
  { key: 'status',         label: 'Status' },
];

export default function CourierMaster() {
  return <MasterPage title="Courier Master" icon={<Truck size={20} />}
    apiPath="diesl_master" fields={fields} columns={columns} />;
}
