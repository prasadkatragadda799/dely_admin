import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, BlockSellerRoute, AdminOnlyRoute, BlockSupportRoute } from './guards';
import { ROUTES } from '@/constants';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import UsersPage from '@/pages/UsersPage';
import Categories from '@/pages/Categories';
import Divisions from '@/pages/Divisions';
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
            <BlockSupportRoute>
              <Products />
            </BlockSupportRoute>
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
              <BlockSupportRoute>
                <Categories />
              </BlockSupportRoute>
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DIVISIONS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <BlockSupportRoute>
                <Divisions />
              </BlockSupportRoute>
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMPANIES}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <BlockSupportRoute>
                <Companies />
              </BlockSupportRoute>
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.OFFERS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <BlockSupportRoute>
                <Offers />
              </BlockSupportRoute>
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
              <BlockSupportRoute>
                <Analytics />
              </BlockSupportRoute>
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.REPORTS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <BlockSupportRoute>
                <WeeklyReports />
              </BlockSupportRoute>
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.INVENTORY}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <BlockSupportRoute>
                <InventoryManagement />
              </BlockSupportRoute>
            </BlockSellerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute>
            <BlockSellerRoute>
              <BlockSupportRoute>
                <Settings />
              </BlockSupportRoute>
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
