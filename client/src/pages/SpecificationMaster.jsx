import React, { useState, useEffect } from 'react';
import MasterPage from '../components/MasterPage';
import { List } from 'lucide-react';

export default function SpecificationMaster() {
  const [subcategories, setSubcategories] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const token = localStorage.getItem('token');
        const [subRes, matRes] = await Promise.all([
          fetch('/api/masters/product_sub_category', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/masters/material_type_master', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const subData = await subRes.json();
        const matData = await matRes.json();

        if (subData.status === 'success') {
          setSubcategories(subData.data || []);
        }
        if (matData.status === 'success') {
          setMaterialTypes(matData.data || []);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    };
    fetchMasters();
  }, []);

  const subcatOptions = subcategories.map(s => ({
    value: String(s.psubcatid ?? s.prod_sub_cat),
    label: s.prod_sub_cat
  }));

  const materialTypeOptions = materialTypes.map(m => ({
    value: String(m.id ?? m.material_type),
    label: m.material_type
  }));

  const fields = [
    { name: 'subcat_id', label: 'Sub-Category', type: 'select', required: true, options: subcatOptions },
    { name: 'property_for', label: 'Material Type (Property For)', type: 'select', required: true, options: materialTypeOptions },
    { name: 'property_name', label: 'Property Name (e.g. Generation)', required: true },
    { name: 'property_value', label: 'Property Value (e.g. 1st Generation)', required: true },
    { name: 'is_prop', label: 'Can use as property?', type: 'select', default: '1',
      options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
    { name: 'status', label: 'Status', type: 'select', default: '1',
      options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
  ];

  const columns = [
    { key: 'subcat_id', label: 'Sub-Category', format: (val) => {
        const sc = subcategories.find(s => String(s.psubcatid ?? s.prod_sub_cat) === String(val));
        return sc ? sc.prod_sub_cat : val;
    } },
    { key: 'property_for', label: 'Material Type (Property For)', format: (val) => {
        const mt = materialTypes.find(m => String(m.id ?? m.material_type) === String(val));
        return mt ? mt.material_type : val;
    } },
    { key: 'property_name', label: 'Property Name' },
    { key: 'property_value', label: 'Property Value' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <MasterPage
      key={`spec-master-${subcategories.length}`}
      title="Specification Master"
      icon={<List size={20} />}
      apiPath="property_master"
      fields={fields}
      columns={columns}
    />
  );
}
