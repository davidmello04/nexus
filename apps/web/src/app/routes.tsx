import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { CategoriesPage } from '@/features/categories/CategoriesPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { ProductsPage } from '@/features/products/ProductsPage'
import { OrderDetailsPage } from '@/features/orders/OrderDetailsPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { QuoteDetailsPage } from '@/features/quotes/QuoteDetailsPage'
import { QuotesPage } from '@/features/quotes/QuotesPage'
import { OrdersReportPage } from '@/features/reports/OrdersReportPage'
import { CompanySettingsPage } from '@/features/settings/CompanySettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'orders/:id',
        element: <OrderDetailsPage />,
      },
      {
        path: 'quotes',
        element: <QuotesPage />,
      },
      {
        path: 'quotes/:id',
        element: <QuoteDetailsPage />,
      },
      {
        path: 'reports/orders',
        element: <OrdersReportPage />,
      },
      {
        path: 'settings/company',
        element: <CompanySettingsPage />,
      },
    ],
  },
])
