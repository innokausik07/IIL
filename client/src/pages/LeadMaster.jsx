import MasterPage from '../components/MasterPage';
import { Target } from 'lucide-react';

const fields = [
  { name: 'lead_title',     label: 'Lead Title / Subject', required: true },
  { name: 'client_name',    label: 'Client / Organization Name' },
  { name: 'contact_person', label: 'Contact Person' },
  { name: 'phone',          label: 'Phone No.' },
  { name: 'email',          label: 'Email ID', type: 'email' },
  { name: 'source',         label: 'Lead Source', type: 'select',
    options: ['Website', 'Referral', 'Exhibition', 'Direct Call', 'Email Campaign', 'Other'] },
  { name: 'lead_status',    label: 'Lead Status', type: 'select', default: 'NEW',
    options: ['NEW', 'CONTACTED', 'IN PROGRESS', 'QUOTED', 'WON', 'LOST'] },
  { name: 'expected_value', label: 'Expected Value (₹)' },
  { name: 'remarks',        label: 'Remarks / Notes', type: 'textarea' },
];

const columns = [
  { key: 'lead_title',     label: 'Title' },
  { key: 'client_name',    label: 'Client' },
  { key: 'contact_person', label: 'Contact' },
  { key: 'lead_status',    label: 'Status' },
  { key: 'expected_value', label: 'Value (₹)' },
];

export default function LeadMaster() {
  return <MasterPage title="Lead Management" icon={<Target size={20} />}
    apiPath="lead_master" fields={fields} columns={columns} />;
}
