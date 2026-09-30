import React, { useState, useEffect } from 'react';
import MasterPage from '../components/MasterPage';
import { List } from 'lucide-react';

export default function SpecificationMaster() {
  const [materialTypes, setMaterialTypes] = useState([]);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/masters/material_type_master', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setMaterialTypes(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching material types:', err);
      }
    };
    fetchMasters();
  }, []);

  const materialTypeOptions = materialTypes.map(m => ({
    value: String(m.id),
    label: m.material_type
  }));

  const fields = [
    { name: 'material_type_id', label: 'Material Type', type: 'select', required: true, options: materialTypeOptions },
    { name: 'specification_name', label: 'Specification Name', required: true },
    { name: 'description', label: 'Description' },
    { name: 'status', label: 'Status', type: 'select', default: 'Active',
      options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
  ];

  const columns = [
    { key: 'material_type_id', label: 'Material Type', format: (val) => {
        const mt = materialTypes.find(m => String(m.id) === String(val));
        return mt ? mt.material_type : val;
    } },
    { key: 'specification_name', label: 'Specification Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <MasterPage
      key={`spec-master-${materialTypes.length}`}
      title="Specification Master"
      icon={<List size={20} />}
      apiPath="specification_master"
      fields={fields}
      columns={columns}
    />
  );
}
