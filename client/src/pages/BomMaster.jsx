import React, { useState, useEffect } from 'react';
import MasterPage from '../components/MasterPage';
import { Cpu } from 'lucide-react';

export default function BomMaster() {
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const token = localStorage.getItem('token');
        const hdr = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
        const [scRes, pRes] = await Promise.all([
          fetch('/api/masters/product_sub_category', { headers: hdr }).then(r => r.json()),
          fetch('/api/masters/product_master', { headers: hdr }).then(r => r.json()),
        ]);

        if (scRes.status === 'success') setSubcategories(scRes.data || []);
        if (pRes.status === 'success') setProducts(pRes.data || []);
      } catch (err) {
        console.error('Failed to load masters for BomMaster:', err);
      }
    };
    loadMasters();
  }, []);

  const subcatOptions = subcategories.map(s => ({
    value: s.prod_sub_cat,
    label: s.prod_sub_cat + (s.product_category ? ` (${s.product_category})` : '')
  }));

  const productOptions = products.map(p => ({
    value: p.product_name,
    label: p.product_name + (p.part_code ? ` [${p.part_code}]` : '')
  }));

  const fields = [
    { name: 'bom_no', label: 'BOM No.', required: true },
    {
      name: 'product_name',
      label: 'Product Name',
      type: 'select',
      options: productOptions,
      required: true,
      onChange: (val, nextForm) => {
        const matched = products.find(p => p.product_name === val);
        if (matched && matched.part_code) {
          nextForm.part_code = matched.part_code;
        }
        return nextForm;
      }
    },
    { name: 'part_code', label: 'Part Code' },
    {
      name: 'subcat_name',
      label: 'Sub-Category',
      type: 'select',
      options: subcatOptions
    },
    { name: 'qty', label: 'Quantity', default: '1' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      default: '1',
      options: [
        { value: '1', label: 'Active' },
        { value: '0', label: 'Inactive' }
      ]
    },
  ];

  const columns = [
    { key: 'bom_no',       label: 'BOM No.' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'part_code',    label: 'Part Code' },
    { key: 'subcat_name',  label: 'Sub-Category' },
    { key: 'qty',          label: 'Qty' },
    { key: 'status',       label: 'Status' },
  ];

  return (
    <MasterPage
      key={`bom-master-${subcategories.length}-${products.length}`}
      title="BOM (Bill of Materials) Master"
      icon={<Cpu size={20} />}
      apiPath="bom_master"
      fields={fields}
      columns={columns}
    />
  );
}

