import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import GoogleSheetList from './pages/GoogleSheetList';
import MovedSheetList from './pages/MovedSheetList';
import CrossAuditList from './pages/CrossAuditList';
import StoreStockList from './pages/StoreStockList';

// Logistics Management
import LogisticsCalculator from './pages/LogisticsCalculator';
import DeliveryChallanMaster from './pages/DeliveryChallanMaster';
import GrnMaster from './pages/GrnMaster';
import ReturnDcMaster from './pages/ReturnDcMaster';
import ShipmentTracking from './pages/ShipmentTracking';
import CourierRateMaster from './pages/CourierRateMaster';

// Function & Sub-Function Masters (Module Hierarchy)
import FunctionMaster from './pages/FunctionMaster';
import SubFunctionMaster from './pages/SubFunctionMaster';

// Admin / Core Masters
import UserMaster from './pages/UserMaster';
import UserForm from './pages/UserForm';
import UserRights from './pages/UserRights';
import UserTypeRights from './pages/UserTypeRights';
import LocationMaster from './pages/LocationMaster';
import LocationForm from './pages/LocationForm';
import StateMaster from './pages/StateMaster';
import CityMaster from './pages/CityMaster';
import BrandMaster from './pages/BrandMaster';
import ColorMaster from './pages/ColorMaster';
import TaxMaster from './pages/TaxMaster';
import CourierMaster from './pages/CourierMaster';
import ParameterMaster from './pages/ParameterMaster';
import BinMaster from './pages/BinMaster';
import AspMaster from './pages/AspMaster';

// Product Management
import ProductCategoryMaster from './pages/ProductCategoryMaster';
import ProductSubcategoryMaster from './pages/ProductSubcategoryMaster';
import ProductMaster from './pages/ProductMaster';
import BomMaster from './pages/BomMaster';
import PriceMaster from './pages/PriceMaster';

// Vendor & Client
import VendorMaster from './pages/VendorMaster';
import ClientMaster from './pages/ClientMaster';

// CRM & Sales
import LeadMaster from './pages/LeadMaster';
import QuotationMaster from './pages/QuotationMaster';
import RfpMaster from './pages/RfpMaster';

// ── Phase 1 ERP: Asset, Rental & Org Masters ──────────────────────────────────
import AssetMaster from './pages/AssetMaster';
import RentalPlanMaster from './pages/RentalPlanMaster';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import PrintRentalAgreement from './pages/PrintRentalAgreement';
import PrintInvoice from './pages/PrintInvoice';
import PrintDeliveryChallan from './pages/PrintDeliveryChallan';
import PrintAssetBarcode from './pages/PrintAssetBarcode';
import OrgMasters from './pages/OrgMasters';

// ── Phase 2 ERP: Rental Orders, Invoices ───────────────────────────────
import RentalOrders from './pages/RentalOrders';
import RentalOrderForm from './pages/RentalOrderForm';
import RentalOrderDetail from './pages/RentalOrderDetail';
import InvoiceMaster from './pages/InvoiceMaster';

// ── Phase 3 ERP: Service & Maintenance, Reports & Analytics ───────────
import ServiceTickets from './pages/ServiceTickets';
import ReportsAnalytics from './pages/ReportsAnalytics';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      
      {/* Enterprise Home / Dashboard */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

      {/* Sheets & Operations */}
      <Route path="/audit/cctv-audit" element={<ProtectedRoute><GoogleSheetList /></ProtectedRoute>} />
      <Route path="/cctv-audit"       element={<ProtectedRoute><GoogleSheetList /></ProtectedRoute>} />
      <Route path="/google-sheet"     element={<ProtectedRoute><GoogleSheetList /></ProtectedRoute>} />
      <Route path="/moved-sheet"      element={<ProtectedRoute><MovedSheetList /></ProtectedRoute>} />
      <Route path="/cross-audit"      element={<ProtectedRoute><CrossAuditList /></ProtectedRoute>} />
      <Route path="/store-stock"      element={<ProtectedRoute><StoreStockList /></ProtectedRoute>} />

      {/* Logistics & Shipping */}
      <Route path="/logistics/calculator"              element={<ProtectedRoute><LogisticsCalculator /></ProtectedRoute>} />
      <Route path="/logistics/delivery-challan"        element={<ProtectedRoute><DeliveryChallanMaster /></ProtectedRoute>} />
      <Route path="/logistics/delivery-challan/:id/print" element={<ProtectedRoute><PrintDeliveryChallan /></ProtectedRoute>} />
      <Route path="/logistics/grn-receipt"             element={<ProtectedRoute><GrnMaster /></ProtectedRoute>} />
      <Route path="/logistics/return-dc"               element={<ProtectedRoute><ReturnDcMaster /></ProtectedRoute>} />
      <Route path="/logistics/dispatch-tracking"       element={<ProtectedRoute><ShipmentTracking /></ProtectedRoute>} />
      <Route path="/logistics/courier-rates"           element={<ProtectedRoute><CourierRateMaster /></ProtectedRoute>} />

      {/* Product Management */}
      <Route path="/products/product-master"     element={<ProtectedRoute><ProductMaster /></ProtectedRoute>} />
      <Route path="/products/category-master"    element={<ProtectedRoute><ProductCategoryMaster /></ProtectedRoute>} />
      <Route path="/products/subcategory-master" element={<ProtectedRoute><ProductSubcategoryMaster /></ProtectedRoute>} />
      <Route path="/products/bom-master"          element={<ProtectedRoute><BomMaster /></ProtectedRoute>} />
      <Route path="/products/price-master"        element={<ProtectedRoute><PriceMaster /></ProtectedRoute>} />

      {/* Vendors & Clients */}
      <Route path="/vendors/vendor-master" element={<ProtectedRoute><VendorMaster /></ProtectedRoute>} />
      <Route path="/crm/client-master"     element={<ProtectedRoute><ClientMaster /></ProtectedRoute>} />

      {/* CRM & Sales */}
      <Route path="/crm/lead-master"      element={<ProtectedRoute><LeadMaster /></ProtectedRoute>} />
      <Route path="/crm/quotation-master" element={<ProtectedRoute><QuotationMaster /></ProtectedRoute>} />
      <Route path="/crm/rfp-master"       element={<ProtectedRoute><RfpMaster /></ProtectedRoute>} />

      {/* ── Phase 1 ERP: Asset Management ─────────────────────────────────── */}
      <Route path="/assets/asset-master"             element={<ProtectedRoute><AssetMaster /></ProtectedRoute>} />
      <Route path="/assets/asset-master/:id/barcode" element={<ProtectedRoute><PrintAssetBarcode /></ProtectedRoute>} />


      {/* ── Phase 1 ERP: Rental Plan Master ───────────────────────────────── */}
      <Route path="/rental/rental-plans"    element={<ProtectedRoute><RentalPlanMaster /></ProtectedRoute>} />

      {/* ── Phase 2 ERP: Rental Orders & Print Agreement ───────────────────── */}
      <Route path="/rental/rental-orders"                 element={<ProtectedRoute><RentalOrders /></ProtectedRoute>} />
      <Route path="/rental/rental-orders/new"              element={<ProtectedRoute><RentalOrderForm /></ProtectedRoute>} />
      <Route path="/rental/rental-orders/edit/:id"         element={<ProtectedRoute><RentalOrderForm /></ProtectedRoute>} />
      <Route path="/rental/rental-orders/:id"              element={<ProtectedRoute><RentalOrderDetail /></ProtectedRoute>} />
      <Route path="/rental/rental-orders/:id/print-agreement" element={<ProtectedRoute><PrintRentalAgreement /></ProtectedRoute>} />

      {/* ── Phase 2 ERP: Finance & Invoices ───────────────────────────────── */}
      <Route path="/finance/invoices"               element={<ProtectedRoute><InvoiceMaster /></ProtectedRoute>} />
      <Route path="/finance/invoices/:id/print"      element={<ProtectedRoute><PrintInvoice /></ProtectedRoute>} />

      {/* ── Phase 4 ERP: Procurement & Purchase Orders ────────────────────── */}
      <Route path="/procurement/purchase-orders"     element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
      <Route path="/procurement/purchase-orders/new" element={<ProtectedRoute><PurchaseOrderForm /></ProtectedRoute>} />

      {/* ── Phase 3 ERP: Service & Maintenance ────────────────────────────── */}
      <Route path="/maintenance/tickets"            element={<ProtectedRoute><ServiceTickets /></ProtectedRoute>} />

      {/* ── Phase 3 ERP: Reports & Executive Analytics ────────────────────── */}
      <Route path="/reports/analytics"              element={<ProtectedRoute><ReportsAnalytics /></ProtectedRoute>} />

      {/* ── Phase 1 ERP: Organization Masters ────────────────────────────── */}
      <Route path="/org/org-levels"         element={<ProtectedRoute><OrgMasters /></ProtectedRoute>} />
      <Route path="/org/org-units"          element={<ProtectedRoute><OrgMasters /></ProtectedRoute>} />
      <Route path="/org/location-types"     element={<ProtectedRoute><OrgMasters /></ProtectedRoute>} />

      {/* Function & Sub-Function Masters */}
      <Route path="/admin/function-master"    element={<ProtectedRoute><FunctionMaster /></ProtectedRoute>} />
      <Route path="/admin/subfunction-master" element={<ProtectedRoute><SubFunctionMaster /></ProtectedRoute>} />

      {/* Master Management (Admin) */}
      <Route path="/admin/user-master"            element={<ProtectedRoute><UserMaster /></ProtectedRoute>} />
      <Route path="/admin/user-master/add"        element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      <Route path="/admin/user-master/edit/:id"   element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      <Route path="/admin/user-master/rights/:id" element={<ProtectedRoute><UserRights /></ProtectedRoute>} />
      <Route path="/admin/usertype-rights"        element={<ProtectedRoute><UserTypeRights /></ProtectedRoute>} />
      <Route path="/admin/create-user"            element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
      <Route path="/admin/location-master"        element={<ProtectedRoute><LocationMaster /></ProtectedRoute>} />
      <Route path="/admin/location-master/add"    element={<ProtectedRoute><LocationForm /></ProtectedRoute>} />
      <Route path="/admin/location-master/edit/:id" element={<ProtectedRoute><LocationForm /></ProtectedRoute>} />
      <Route path="/admin/state-master"     element={<ProtectedRoute><StateMaster /></ProtectedRoute>} />
      <Route path="/admin/city-master"      element={<ProtectedRoute><CityMaster /></ProtectedRoute>} />
      <Route path="/admin/brand-master"     element={<ProtectedRoute><BrandMaster /></ProtectedRoute>} />
      <Route path="/admin/color-master"     element={<ProtectedRoute><ColorMaster /></ProtectedRoute>} />
      <Route path="/admin/tax-master"       element={<ProtectedRoute><TaxMaster /></ProtectedRoute>} />
      <Route path="/admin/courier-master"   element={<ProtectedRoute><CourierMaster /></ProtectedRoute>} />
      <Route path="/admin/parameter-master" element={<ProtectedRoute><ParameterMaster /></ProtectedRoute>} />
      <Route path="/admin/bin-master"       element={<ProtectedRoute><BinMaster /></ProtectedRoute>} />
      <Route path="/admin/asp-master"       element={<ProtectedRoute><AspMaster /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
