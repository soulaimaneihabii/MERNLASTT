import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Spin fullscreen tip="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return <Spin fullscreen tip="Loading user data..." />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="403 - Forbidden"
        subTitle="You don't have permission to access this page"
        extra={<Button type="primary" onClick={() => window.history.back()}>Go Back</Button>}
      />
    );
  }

  return children;
};

export default ProtectedRoute;