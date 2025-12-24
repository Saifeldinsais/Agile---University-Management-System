import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRoles, userRole, children }) {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole.toLowerCase())) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
