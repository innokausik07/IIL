import MasterPage from '../components/MasterPage';
import { Send } from 'lucide-react';

const fields = [
  { name: 'dc_no',         label: 'DC Number',           required: true },
  { name: 'dc_date',       label: 'DC Date',             type: 'date' },
  { name: 'dc_type',       label: 'DC Type',             type: 'select', options: ['Outward (Rental)', 'Outward (Sale)', 'Stock Transfer', 'Repair/TRC'] },
  { name: 'client_name',   label: 'Client / Consignee',  required: true },
  { name: 'from_location', label: 'From Warehouse/City' },
  { name: 'to_location',   label: 'Destination City/Site' },
  { name: 'courier_name',  label: 'Transporter / Courier' },
  { name: 'docket_no',     label: 'Docket / AWB No.' },
  { name: 'total_qty',     label: 'Total Units / Qty' },
  { name: 'total_weight',  label: 'Weight (KG)' },
  { name: 'status',        label: 'Dispatch Status',     type: 'select', default: 'Dispatched',
    options: ['Draft', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'] },
  { name: 'remarks',       label: 'Remarks',             type: 'textarea' },
];

const columns = [
  { key: 'dc_no',        label: 'DC No.' },
  { key: 'dc_date',      label: 'Date' },
  { key: 'client_name',  label: 'Client' },
  { key: 'to_location',  label: 'Destination' },
  { key: 'courier_name', label: 'Carrier' },
  { key: 'docket_no',    label: 'AWB/Docket' },
  { key: 'status',       label: 'Status' },
];

export default function DeliveryChallanMaster() {
  return <MasterPage title="Delivery Challan (DC) Management" icon={<Send size={20} />}
    apiPath="delivery_challan" fields={fields} columns={columns} />;
}
