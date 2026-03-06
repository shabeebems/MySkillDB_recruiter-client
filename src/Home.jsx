import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 bg-gray-100">
      <h1 className="text-3xl font-bold">Welcome to the System</h1>
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/master/dashboard")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Master Dashboard
        </button>
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Go to Organization Admin Dashboard
        </button>
      </div>
    </div>
  );
}

export default HomePage;
