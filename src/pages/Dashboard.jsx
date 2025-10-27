import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [beds, setBeds] = useState(12);
  const [capacity, setCapacity] = useState(20);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) navigate("/login");
  }, []);

  const handleSave = () => {
    alert("✅ Changes saved (demo only — no actual database update)");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/");
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Shelter Dashboard</h2>
      <p className="mb-4 text-gray-600">Update your shelter info below:</p>

      <div className="mb-4">
        <label className="block font-semibold">Available Beds</label>
        <input
          type="number"
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
          className="border rounded p-2 w-32"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Total Capacity</label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="border rounded p-2 w-32"
        />
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-3"
      >
        Save Changes
      </button>
      <button
        onClick={handleLogout}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Log Out
      </button>
    </div>
  );
}
