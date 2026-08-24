import MasterPage from '../components/MasterPage';
import { Building2 } from 'lucide-react';

const fields = [
  { name: 'city',    label: 'City Name', required: true },
  { name: 'state',   label: 'State',     required: true },
  { name: 'country', label: 'Country',   default: 'India' },
  { name: 'status',  label: 'Status', type: 'select', default: 'A',
    options: [{ value: 'A', label: 'Active' }, { value: 'I', label: 'Inactive' }] },
];

const columns = [
  { key: 'city',    label: 'City' },
  { key: 'state',   label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'status',  label: 'Status' },
];

export default function CityMaster() {
  return <MasterPage title="City Master" icon={<Building2 size={20} />}
    apiPath="district_master" fields={fields} columns={columns} />;
}
