import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { isAuthenticated } from "@/utils/authHelpers";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated: isAuthenticatedRedux } = useSelector(
    (state: RootState) => state.auth
  );

  // Check both Redux state and localStorage
  const isAuth = isAuthenticatedRedux || isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
