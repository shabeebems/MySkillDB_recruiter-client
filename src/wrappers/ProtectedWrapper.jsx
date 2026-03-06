import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { setUser } from "../redux/userSlice";
import { setOrganization } from "../redux/organizationSlice";
import { setAssignment } from "../redux/assignmentSlice";
import { getRequest } from "../api/apiRequests";

const ProtectedWrapper = ({ allowedRoles = [] }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        // ✅ Use getRequest helper for /me
        const response = await getRequest("/me");
        const userData = response.data.data;
        dispatch(setUser(userData));

        // ✅ Fetch organization using getRequest too
        if (userData.organizationId) {
          const orgResponse = await getRequest(`/organization/${userData.organizationId}`);
          dispatch(setOrganization(orgResponse.data.data));
        }

        // ✅ Fetch assignment if assignmentId exists
        if (userData.assignmentId) {
          const assignmentResponse = await getRequest(`/organization-setup/assignments/${userData.assignmentId}`);
          dispatch(setAssignment(assignmentResponse.data.data));
        }

      } catch (err) {
        console.error("Error fetching user info:", err.response?.data || err);
        dispatch(setUser(null));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [dispatch, location.pathname]);

  if (loading) return <div>Loading...</div>;

  if (!user?.role) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role))
    return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedWrapper;
