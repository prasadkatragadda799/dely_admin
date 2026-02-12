import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

const Index = () => {
  return <Navigate to={ROUTES.DASHBOARD} replace />;
};

export default Index;
