import MasterPage from '../components/MasterPage';
import { Undo2 } from 'lucide-react';

const fields = [
  { name: 'return_dc_no', label: 'Return DC No.',    required: true },
  { name: 'return_date',  label: 'Return Date',      type: 'date' },
  { name: 'client_name',  label: 'Client / Site',    required: true },
  { name: 'reason',       label: 'Return Reason',    type: 'select',
    options: ['Rental Return', 'Faulty Replacement', 'Testing Completed', 'Order Cancellation', 'Other'] },
  { name: 'from_city',    label: 'Pickup City/Site' },
  { name: 'to_warehouse', label: 'Destination Warehouse' },
  { name: 'courier_name', label: 'Courier Partner' },
  { name: 'docket_no',    label: 'Docket / Tracking No.' },
  { name: 'status',       label: 'Status',           type: 'select', default: 'Pending Pickup',
    options: ['Pending Pickup', 'In Transit', 'Received at WH', 'Closed'] },
];

const columns = [
  { key: 'return_dc_no', label: 'Return DC' },
  { key: 'client_name',  label: 'Client' },
  { key: 'reason',       label: 'Reason' },
  { key: 'to_warehouse', label: 'To Warehouse' },
  { key: 'courier_name', label: 'Courier' },
  { key: 'docket_no',    label: 'Docket' },
  { key: 'status',       label: 'Status' },
];

export default function ReturnDcMaster() {
  return <MasterPage title="Return DC / Reverse Logistics" icon={<Undo2 size={20} />}
    apiPath="return_dc_master" fields={fields} columns={columns} />;
}
