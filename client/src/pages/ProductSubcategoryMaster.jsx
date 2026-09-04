import React, { useState, useEffect } from 'react';
import MasterPage from '../components/MasterPage';
import { GitFork } from 'lucide-react';

export default function ProductSubcategoryMaster() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/masters/product_cat_master', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const catNameOptions = categories.map(c => ({
    value: c.cat_name,
    label: c.cat_name + (c.short_code ? ` (${c.short_code})` : '')
  }));

  const catCodeOptions = categories.map(c => ({
    value: c.short_code || String(c.catid),
    label: `${c.short_code || c.catid} — ${c.cat_name}`
  }));

  const fields = [
    { name: 'prod_sub_cat', label: 'Sub-Category Name', required: true },
    {
      name: 'product_category',
      label: 'Parent Category Name',
      type: 'select',
      options: catNameOptions,
      onChange: (val, nextForm) => {
        const matched = categories.find(c => c.cat_name === val);
        if (matched) {
          nextForm.productid = matched.short_code || String(matched.catid);
        }
        return nextForm;
      }
    },
    {
      name: 'productid',
      label: 'Category Code/ID',
      type: 'select',
      options: catCodeOptions,
      onChange: (val, nextForm) => {
        const matched = categories.find(
          c => (c.short_code && c.short_code === val) || String(c.catid) === String(val)
        );
        if (matched) {
          nextForm.product_category = matched.cat_name;
        }
        return nextForm;
      }
    },
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
    { key: 'prod_sub_cat',     label: 'Sub-Category Name' },
    { key: 'product_category', label: 'Parent Category' },
    { key: 'productid',        label: 'Category Code/ID' },
    { key: 'status',           label: 'Status' },
  ];

  return (
    <MasterPage
      key={`subcat-master-${categories.length}`}
      title="Product Sub-Category Master"
      icon={<GitFork size={20} />}
      apiPath="product_sub_category"
      fields={fields}
      columns={columns}
    />
  );
}

