import React, { useState, useEffect } from 'react';
import MasterPage from '../components/MasterPage';
import { CircleDollarSign } from 'lucide-react';

export default function PriceMaster() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const hdr = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
        const res = await fetch('/api/masters/product_master', { headers: hdr });
        const data = await res.json();
        if (data.status === 'success') setProducts(data.data || []);
      } catch (err) {
        console.error('Failed to load products for PriceMaster:', err);
      }
    };
    loadProducts();
  }, []);

  const productOptions = products.map(p => ({
    value: p.product_name,
    label: p.product_name + (p.part_code ? ` [${p.part_code}]` : '')
  }));

  const fields = [
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
    { name: 'part_code',      label: 'Part Code',      required: true },
    { name: 'purchase_price', label: 'Purchase Price (₹)' },
    { name: 'selling_price',  label: 'Selling Price (₹)' },
    { name: 'rental_price',   label: 'Rental Price (₹)' },
    { name: 'status',         label: 'Status', type: 'select', default: '1',
      options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
  ];

  const columns = [
    { key: 'part_code',      label: 'Part Code' },
    { key: 'product_name',   label: 'Product Name' },
    { key: 'purchase_price', label: 'Purchase (₹)' },
    { key: 'selling_price',  label: 'Selling (₹)' },
    { key: 'rental_price',   label: 'Rental (₹)' },
    { key: 'status',         label: 'Status' },
  ];

  return (
    <MasterPage
      key={`price-master-${products.length}`}
      title="Price Master"
      icon={<CircleDollarSign size={20} />}
      apiPath="price_master"
      fields={fields}
      columns={columns}
    />
  );
}

