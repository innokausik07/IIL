import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import '../styles/erp.css';

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

  useEffect(() => {
    const fetchInv = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/finance/invoices/${id}`, { headers });
        const data = await res.json();
        if (data.status === 'success') {
          setInvoice(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInv();
  }, [id]);

  if (loading) {
    return <div className="erp-loader"><div className="erp-spinner" /></div>;
  }

  if (!invoice) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Invoice not found.</div>;
  }

  const subtotal = parseFloat(invoice.subtotal || 0);
  const taxAmount = parseFloat(invoice.tax_amount || 0);
  const totalAmount = parseFloat(invoice.total_amount || 0);
  const paidAmount = parseFloat(invoice.paid_amount || 0);
  const balanceDue = parseFloat(invoice.balance_due || (totalAmount - paidAmount));

  // Split into CGST (9%) and SGST (9%) if intra-state
  const halfTax = taxAmount / 2;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* Print Action Bar */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/finance/invoices')} className="erp-btn-ghost">
          <ArrowLeft size={14} /> Back to Invoices
        </button>
        <button onClick={() => window.print()} className="erp-btn-primary" style={{ padding: '8px 24px' }}>
          <Printer size={15} /> Print Tax Invoice / PDF
        </button>
      </div>

      {/* A4 Tax Invoice */}
      <div style={{
        maxWidth: '850px',
        margin: '0 auto',
        background: '#fff',
        padding: '48px',
        borderRadius: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        color: '#0f172a',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
              INNOVATIVIEW INDIA PRIVATE LIMITED
            </h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#475569' }}>
              IT Infrastructure, Cloud Services & Hardware Rental
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              GSTIN: 19AAACI1234F1Z5 | PAN: AAACI1234F | State: West Bengal (Code: 19)
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#059669', color: '#fff', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>
              TAX INVOICE
            </span>
            <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
              {invoice.invoice_no}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Invoice Date: {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : '—'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Due Date: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '—'}
            </div>
          </div>
        </div>

        {/* Billed To Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '24px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              BILLED TO (CLIENT DETAILS):
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e40af' }}>{invoice.client_name}</div>
            <div style={{ fontSize: '11.5px', color: '#334155' }}>Address: {invoice.client_address || invoice.billing_address || 'Registered Corporate Office'}</div>
            <div style={{ fontSize: '11.5px', color: '#334155' }}>GSTIN: {invoice.client_gstin || 'Unregistered / Consumer'}</div>
            {invoice.client_phone && <div style={{ fontSize: '11.5px', color: '#334155' }}>Phone: {invoice.client_phone}</div>}
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              ORDER & BILLING INFO:
            </div>
            <div style={{ fontSize: '12px' }}>Rental Order: <strong>{invoice.order_no || 'Direct Invoicing'}</strong></div>
            <div style={{ fontSize: '12px' }}>Billing Period: {invoice.billing_start_date ? `${invoice.billing_start_date} to ${invoice.billing_end_date}` : 'Monthly Rental'}</div>
            <div style={{ fontSize: '12px' }}>Payment Status: <strong style={{ color: invoice.status === 'Paid' ? '#059669' : '#d97706' }}>{invoice.status}</strong></div>
          </div>
        </div>

        {/* Item Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '40px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description & Service Details</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>HSN / SAC</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Rate (₹)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lines || []).length === 0 ? (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>1</td>
                <td style={{ padding: '10px' }}>
                  <strong>IT Hardware Equipment Monthly Rental Services</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>As per Rental Order {invoice.order_no}</div>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>9973</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>1</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ) : (
              (invoice.lines || []).map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{i + 1}</td>
                  <td style={{ padding: '10px' }}>
                    <strong>{l.product_name || l.description}</strong>
                    {l.part_code && <span style={{ fontSize: '11px', color: '#64748b' }}> ({l.part_code})</span>}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{l.hsn_code || '9973'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{l.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(l.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(l.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Calculation Summary & Bank Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '30px' }}>
          {/* Bank Account */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              BANK REMITTANCE DETAILS:
            </div>
            <div>Bank: <strong>HDFC Bank Limited</strong></div>
            <div>Account Name: <strong>Innovatiview India Pvt. Ltd.</strong></div>
            <div>Account No: <strong>50200012345678</strong></div>
            <div>IFSC Code: <strong>HDFC0000123</strong></div>
            <div>Branch: Central Business District, Kolkata</div>
          </div>

          {/* Totals Breakdown */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Taxable Subtotal:</span>
              <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>CGST (9.00%):</span>
              <span>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>SGST (9.00%):</span>
              <span>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '14px', marginBottom: '6px' }}>
              <strong>Total Invoice Amount:</strong>
              <strong style={{ color: '#059669' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d97706' }}>
              <span>Balance Due:</span>
              <strong>₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', maxWidth: '350px' }}>
            This is a computer-generated tax invoice. For electronic invoice verification or billing inquiries, contact finance@innovatiview.com.
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '12px' }}>For Innovatiview India Pvt. Ltd.</div>
            <div style={{ height: '40px' }} />
            <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
