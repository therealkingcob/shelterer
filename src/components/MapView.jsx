import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { supabase } from "../../supabase.js";
import "leaflet/dist/leaflet.css";

// Fix for default markers not showing in react-leaflet
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;

const shelterIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png", // blue pin
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png", // green pin
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

const iconMap = {
  shelter: shelterIcon,
  restaurant: restaurantIcon,
};

const MapView = () => {
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    description: "",
    type: "shelter",
  });
  const [selectedCoords, setSelectedCoords] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from("locations").select("*");
      if (!error) setLocations(data);
    };
    fetchLocations();

    const channel = supabase
      .channel("public:locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        (payload) => {
          setLocations((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Map click handler - fixed to properly handle coordinates
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        console.log("Clicked coords:", e.latlng);
        setSelectedCoords({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
        setShowForm(true);
      },
    });
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoords) {
      alert("Please click on the map to set a location.");
      return;
    }

    const { data, error } = await supabase.from("locations").insert([
      {
        name: newLocation.name,
        description: newLocation.description,
        type: newLocation.type,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      },
    ]);

    if (error) {
      console.error("Error adding location:", error);
      alert("Error adding location");
    } else {
      // Note: Supabase typically returns the inserted data in data[0]
      if (data && data.length > 0) {
        setLocations([...locations, data[0]]);
      }
      setShowForm(false);
      setNewLocation({ name: "", description: "", type: "shelter" });
      setSelectedCoords(null);
    }
  };

  return (
    <div className="relative w-full h-screen">
  {/* Map */}
  <MapContainer
  center={[32.9, -117.1]}
  zoom={12}
  className="absolute top-0 left-0 w-full h-full z-0"
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="&copy; OpenStreetMap contributors"
  />

  {locations.map((loc) => (
    <Marker
      key={loc.id}
      position={[loc.lat, loc.lng]}
      icon={iconMap[loc.type?.toLowerCase()] || shelterIcon} // pick icon
    >
      <Popup>
        <strong>{loc.name}</strong> <br />
        {loc.description} <br />
        <em>Type: {loc.type}</em>
      </Popup>
    </Marker>
  ))}

  <LocationMarker />
</MapContainer>


  {/* Floating Add Button */}
  <button
    onClick={() => setShowForm(true)}
    className="absolute top-4 left-20 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 z-50"
  >
    Add Location
  </button>

  {/* Floating Popup Form */}
  {showForm && (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white shadow-lg p-6 rounded-lg w-80 z-50">
      <h3 className="text-lg font-bold mb-2">Add a New Location</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Name:</label>
          <input
            type="text"
            value={newLocation.name}
            onChange={(e) =>
              setNewLocation({ ...newLocation, name: e.target.value })
            }
            required
            className="border border-gray-300 w-full rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description:</label>
          <textarea
            value={newLocation.description}
            onChange={(e) =>
              setNewLocation({ ...newLocation, description: e.target.value })
            }
            required
            className="border border-gray-300 w-full rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Type:</label>
          <select
            value={newLocation.type}
            onChange={(e) =>
              setNewLocation({ ...newLocation, type: e.target.value })
            }
            className="border border-gray-300 w-full rounded p-2"
          >
            <option value="shelter">Shelter</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>
        <div>Please Click the Map to Select the Location.</div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setSelectedCoords(null);
          }}
          className="ml-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </form>
    </div>
  )}
</div>
  );
};

export default MapView;