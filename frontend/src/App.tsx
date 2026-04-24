import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import SuppliersPage from './pages/SuppliersPage'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/params/CategoriesPage'
import ClientTypesPage from './pages/params/ClientTypesPage'
import ZonesPage from './pages/params/ZonesPage'
import VatConditionsPage from './pages/params/VatConditionsPage'
import PaymentConditionsPage from './pages/params/PaymentConditionsPage'
import StockLocationsPage from './pages/params/StockLocationsPage'
import SystemConfigPage from './pages/params/SystemConfigPage'
import PriceListsPage from './pages/PriceListsPage'
import PriceListDetailPage from './pages/PriceListDetailPage'
import SalesInvoicesPage from './pages/SalesInvoicesPage'
import SalesInvoiceFormPage from './pages/SalesInvoiceFormPage'
import PurchaseInvoicesPage from './pages/PurchaseInvoicesPage'
import PurchaseInvoiceFormPage from './pages/PurchaseInvoiceFormPage'
import StockPage from './pages/StockPage'
import StockAdjustmentsPage from './pages/StockAdjustmentsPage'
import StockMovementsPage from './pages/StockMovementsPage'
import ReportsPage from './pages/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/security/UsersPage'
import RolesPage from './pages/security/RolesPage'
import PaymentMethodsPage from './pages/params/PaymentMethodsPage'
import InvoiceTypesPage from './pages/params/InvoiceTypesPage'
import ClientAccountPage from './pages/ClientAccountPage'
import SupplierAccountPage from './pages/SupplierAccountPage'
import CashPage from './pages/CashPage'
import CashSessionsPage from './pages/CashSessionsPage'
import CashSessionDetailPage from './pages/CashSessionDetailPage'
import ReceivablesPage from './pages/ReceivablesPage'
import PayablesPage from './pages/PayablesPage'
import InstallmentPlansPage from './pages/InstallmentPlansPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id/account" element={<ClientAccountPage />} />
        <Route path="suppliers/:id/account" element={<SupplierAccountPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="price-lists" element={<PriceListsPage />} />
        <Route path="price-lists/:id" element={<PriceListDetailPage />} />
        <Route path="sales" element={<SalesInvoicesPage />} />
        <Route path="sales/new" element={<SalesInvoiceFormPage />} />
        <Route path="sales/:id" element={<SalesInvoiceFormPage />} />
        <Route path="purchases" element={<PurchaseInvoicesPage />} />
        <Route path="purchases/new" element={<PurchaseInvoiceFormPage />} />
        <Route path="purchases/:id" element={<PurchaseInvoiceFormPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="stock/adjustments" element={<StockAdjustmentsPage />} />
        <Route path="stock/movements" element={<StockMovementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="cash" element={<CashPage />} />
        <Route path="cash/sessions" element={<CashSessionsPage />} />
        <Route path="cash/sessions/:id" element={<CashSessionDetailPage />} />
        <Route path="receivables" element={<ReceivablesPage />} />
        <Route path="payables" element={<PayablesPage />} />
        <Route path="installment-plans" element={<InstallmentPlansPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="params/categories" element={<CategoriesPage />} />
        <Route path="params/client-types" element={<ClientTypesPage />} />
        <Route path="params/zones" element={<ZonesPage />} />
        <Route path="params/vat-conditions" element={<VatConditionsPage />} />
        <Route path="params/payment-conditions" element={<PaymentConditionsPage />} />
        <Route path="params/payment-methods" element={<PaymentMethodsPage />} />
        <Route path="params/invoice-types" element={<InvoiceTypesPage />} />
        <Route path="params/stock-locations" element={<StockLocationsPage />} />
        <Route path="params/system-config" element={<SystemConfigPage />} />
        <Route path="security/users" element={<UsersPage />} />
        <Route path="security/roles" element={<RolesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
