import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, BlockSellerRoute, AdminOnlyRoute } from './guards';
import { ROUTES } from '@/constants';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import UsersPage from '@/pages/UsersPage';
import Categories from '@/pages/Categories';
import Companies from '@/pages/Companies';
import Offers from '@/pages/Offers';
import KYC from '@/pages/KYC';
import Analytics from '@/pages/Analytics';
import WeeklyReports from '@/pages/WeeklyReports';
import InventoryManagement from '@/pages/InventoryManagement';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Sellers from '@/pages/Sellers';
import DeliveryPersons from '@/pages/DeliveryPersons';
import DeliveryTracking from '@/pages/DeliveryTracking';
import NotFound from '@/pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PRODUCTS}
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ORDERS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <Orders />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <UsersPage />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.CATEGORIES}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <Categories />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMPANIES}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <Companies />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.OFFERS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <Offers />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.KYC}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <KYC />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ANALYTICS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <Analytics />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.REPORTS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <WeeklyReports />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.INVENTORY}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <InventoryManagement />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <Settings />
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SELLERS}
        element={
          <ProtectedRoute>
            <AdminOnlyRoute>
              <Sellers />
            </AdminOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DELIVERY_PERSONS}
        element={
          <ProtectedRoute>
            <AdminOnlyRoute>
              <DeliveryPersons />
            </AdminOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DELIVERY_TRACKING}
        element={
          <ProtectedRoute>
            <AdminOnlyRoute>
              <DeliveryTracking />
            </AdminOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
