import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { setUser } from "../redux/userSlice";
import { getRequest } from "../api/apiRequests";

const AuthWrapper = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user); // get user from Redux
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // ✅ track route changes

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true); // start loading on every route change
        const response = await getRequest("/auth/me");

        if (response.data.success) {
          if (response.data.data) {
            dispatch(setUser(response.data.data));
          } else {
            dispatch(setUser(null)); // No user logged in
          }
        } else {
          dispatch(setUser(null)); // Error case
        }
      } catch (err) {
        console.error("Error fetching user info:", err.response?.data || err);
        dispatch(setUser(null)); // clear user if error
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [dispatch, location.pathname]); // ✅ run on every navigation

  if (loading) return <div>Loading...</div>; // wait until /api/me completes

  // Redirect based on role if logged in
  if (user?.role) {
    switch (user.role) {
      case "master_admin":
        return <Navigate to="/master/dashboard" replace />;
      case "org_admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "student":
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Outlet />; // unknown role, stay in current route
    }
  }

  return <Outlet />; // if no user info, allow access to login routes
};

export default AuthWrapper;
