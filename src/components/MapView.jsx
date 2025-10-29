import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { supabase } from "../../supabase.js";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

// Default marker fix
delete L.Icon.Default.prototype._getIconUrl;

const shelterIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9036/9036497.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

const redIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const iconMap = {
  shelter: shelterIcon,
  restaurant: restaurantIcon,
};

const MapView = () => {
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    description: "",
    type: "shelter",
  });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [reviewText, setReviewText] = useState({});
    const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([32.9, -117.1]);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (err) => {
          console.warn("Could not get location:", err);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);// store input for each location

  // Fetch locations and reviews
  useEffect(() => {
    const fetchLocations = async () => {
      const { data: locData, error: locError } = await supabase.from("locations").select("*");
      if (!locError) setLocations(locData || []);

      const { data: revData, error: revError } = await supabase.from("reviews").select("*");
      if (!revError) {
        const revMap = {};
        revData.forEach((r) => {
          if (!revMap[r.location_id]) revMap[r.location_id] = [];
          revMap[r.location_id].push(r);
        });
        setReviews(revMap);
      }
    };

    fetchLocations();

    const locChannel = supabase
      .channel("public:locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        (payload) => {
          setLocations((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    const revChannel = supabase
      .channel("public:reviews")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        (payload) => {
          setReviews((prev) => ({
            ...prev,
            [payload.new.location_id]: [...(prev[payload.new.location_id] || []), payload.new],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(locChannel);
      supabase.removeChannel(revChannel);
    };
  }, []);

  // Map click handler
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setSelectedCoords({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
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
      if (data && data.length > 0) {
        setLocations([...locations, data[0]]);
      }
      setShowForm(false);
      setNewLocation({ name: "", description: "", type: "shelter" });
      setSelectedCoords(null);
    }
  };

  const handleAddReview = async (locationId) => {
    if (!reviewText[locationId] || reviewText[locationId].trim() === "") return;

    const { data, error } = await supabase.from("reviews").insert([
      {
        location_id: locationId,
        text: reviewText[locationId],
      },
    ]);

    if (error) {
      console.error("Error adding review:", error);
      alert("Error adding review");
    } else {
      setReviewText((prev) => ({ ...prev, [locationId]: "" }));
    }
  };

  return (
    <div className="relative w-full h-screen">
      <MapContainer center={[32.9, -117.1]} zoom={12} className="absolute top-0 left-0 w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {userLocation && (
          <Marker position={userLocation} icon={redIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={iconMap[loc.type?.toLowerCase()] || shelterIcon}>
            <Popup>
              <div>
                <strong>{loc.name}</strong> <br />
                {loc.description} <br />
                <em>Type: {loc.type}</em>
              </div>

              <hr className="my-2" />

              <div className="space-y-2">
                <div>
                  <input
                    type="text"
                    placeholder="Add a review"
                    value={reviewText[loc.id] || ""}
                    onChange={(e) =>
                      setReviewText((prev) => ({ ...prev, [loc.id]: e.target.value }))
                    }
                    className="border border-gray-300 rounded w-full p-1"
                  />
                  <button
                    onClick={() => handleAddReview(loc.id)}
                    className="mt-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>

                <div>
                  {reviews[loc.id]?.map((r, index) => (
                    <div key={index} className="border-t border-gray-200 pt-1 text-sm">
                      - {r.text}
                    </div>
                  ))}
                </div>
              </div>
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
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                required
                className="border border-gray-300 w-full rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description:</label>
              <textarea
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                required
                className="border border-gray-300 w-full rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Type:</label>
              <select
                value={newLocation.type}
                onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                className="border border-gray-300 w-full rounded p-2"
              >
                <option value="shelter">Shelter</option>
                <option value="restaurant">Restaurant</option>
              </select>
            </div>
            <div>Please Click the Map to Select the Location.</div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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
