import MasterPage from '../components/MasterPage';
import { Navigation } from 'lucide-react';

const fields = [
  { name: 'awb_number',      label: 'AWB / Tracking Number', required: true },
  { name: 'courier_name',    label: 'Courier Partner',       required: true },
  { name: 'ref_doc_no',      label: 'Reference (DC / PO No.)' },
  { name: 'origin_pin',      label: 'Origin Pincode' },
  { name: 'dest_pin',        label: 'Destination Pincode' },
  { name: 'weight_kg',       label: 'Weight (KG)' },
  { name: 'shipping_mode',   label: 'Shipping Mode',         type: 'select', options: ['Surface', 'Express', 'Air'] },
  { name: 'shipment_cost',   label: 'Freight Cost (₹)' },
  { name: 'dispatch_date',   label: 'Dispatch Date',         type: 'date' },
  { name: 'delivery_status', label: 'Delivery Status',       type: 'select', default: 'In Transit',
    options: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'RTO'] },
  { name: 'delivery_date',   label: 'Delivery Date',         type: 'date' },
];

const columns = [
  { key: 'awb_number',      label: 'AWB / Docket' },
  { key: 'courier_name',    label: 'Courier' },
  { key: 'ref_doc_no',      label: 'Ref Doc' },
  { key: 'weight_kg',       label: 'Weight (KG)' },
  { key: 'shipping_mode',   label: 'Mode' },
  { key: 'delivery_status', label: 'Status' },
];

export default function ShipmentTracking() {
  return <MasterPage title="Shipment & Dispatch Tracking" icon={<Navigation size={20} />}
    apiPath="logistics_shipment" fields={fields} columns={columns} />;
}
