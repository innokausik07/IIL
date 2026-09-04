import React, { useState, useEffect } from 'react';
import MasterPage from '../components/MasterPage';
import { Package } from 'lucide-react';

export default function ProductMaster() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const token = localStorage.getItem('token');
        const hdr = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
        const [cRes, scRes, bRes, clRes] = await Promise.all([
          fetch('/api/masters/product_cat_master', { headers: hdr }).then(r => r.json()),
          fetch('/api/masters/product_sub_category', { headers: hdr }).then(r => r.json()),
          fetch('/api/masters/make_master', { headers: hdr }).then(r => r.json()),
          fetch('/api/masters/color_master', { headers: hdr }).then(r => r.json()),
        ]);

        if (cRes.status === 'success') setCategories(cRes.data || []);
        if (scRes.status === 'success') setSubcategories(scRes.data || []);
        if (bRes.status === 'success') setBrands(bRes.data || []);
        if (clRes.status === 'success') setColors(clRes.data || []);
      } catch (err) {
        console.error('Failed to load masters for ProductMaster:', err);
      }
    };
    loadMasters();
  }, []);

  const categoryOptions = categories.map(c => ({
    value: String(c.catid ?? c.cat_name),
    label: c.cat_name
  }));

  const subcatOptions = subcategories.map(s => ({
    value: String(s.psubcatid ?? s.prod_sub_cat),
    label: s.prod_sub_cat
  }));

  const brandOptions = brands.map(b => ({
    value: String(b.id ?? b.make),
    label: b.make
  }));

  const colorOptions = colors.map(c => ({
    value: c.color_name,
    label: c.color_name
  }));

  const fields = [
    { name: 'product_name',        label: 'Product / Item Name', required: true },
    { name: 'part_code',           label: 'Part Code (PID)' },
    { name: 'item_code',           label: 'Item Code' },
    { name: 'product_category_id', label: 'Category', type: 'select', options: categoryOptions },
    { name: 'product_subcat_id',   label: 'Sub-Category', type: 'select', options: subcatOptions },
    { name: 'brand_id',            label: 'Brand / Make', type: 'select', options: brandOptions },
    { name: 'model',               label: 'Model Name' },
    { name: 'hsn_code',            label: 'HSN Code' },
    { name: 'product_color',       label: 'Color', type: 'select', options: colorOptions },
    { name: 'product_type',        label: 'Product Type', type: 'select', default: 'UNIT',
      options: ['UNIT', 'SPARE', 'ACCESSORY'] },
    { name: 'is_serialize',        label: 'Serialized', type: 'select', default: 'Y',
      options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }] },
    { name: 'warranty_days',       label: 'Warranty (Days)' },
    { name: 'product_description', label: 'Description', type: 'textarea' },
    { name: 'status_id',           label: 'Status', type: 'select', default: '1',
      options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
  ];

  const columns = [
    { key: 'part_code',    label: 'Part Code' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'model',        label: 'Model' },
    { key: 'product_type', label: 'Type' },
    { key: 'hsn_code',     label: 'HSN' },
    { key: 'status_id',    label: 'Status' },
  ];

  return (
    <MasterPage
      key={`prod-master-${categories.length}-${subcategories.length}`}
      title="Product / Item Master"
      icon={<Package size={20} />}
      apiPath="product_master"
      fields={fields}
      columns={columns}
    />
  );
}

