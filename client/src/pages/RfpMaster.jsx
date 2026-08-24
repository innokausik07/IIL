import MasterPage from '../components/MasterPage';
import { Award } from 'lucide-react';

const fields = [
  { name: 'rfp_no',          label: 'RFP / Tender No.',  required: true },
  { name: 'title',           label: 'Project / Tender Title', required: true },
  { name: 'client_name',     label: 'Issuing Organization' },
  { name: 'submission_date', label: 'Submission Due Date', type: 'date' },
  { name: 'estimated_value', label: 'Estimated Value (₹)' },
  { name: 'status',          label: 'Status', type: 'select', default: 'Open',
    options: ['Open', 'Under Review', 'Submitted', 'Awarded', 'Lost'] },
];

const columns = [
  { key: 'rfp_no',          label: 'RFP No.' },
  { key: 'title',           label: 'Title' },
  { key: 'client_name',     label: 'Client / Authority' },
  { key: 'submission_date', label: 'Due Date' },
  { key: 'status',          label: 'Status' },
];

export default function RfpMaster() {
  return <MasterPage title="RFP / Tender Management" icon={<Award size={20} />}
    apiPath="rfp_master" fields={fields} columns={columns} />;
}
