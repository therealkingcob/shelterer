import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../services/supabase";
import AddLocationModal from "./AddLocationModal";
import ReviewsModal from "./ReviewsModal";
import LoginModal from "./LoginModal";

/* Fix default marker icon for many CRA/Vite setups */
const DefaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  const [locations, setLocations] = useState([]); // rows from locations table
  const [reviewsByLocation, setReviewsByLocation] = useState({}); // {locationId: [reviews]}
  const [user, setUser] = useState(null);

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // edit beds UI
  const [editBedsValue, setEditBedsValue] = useState({}); // {locationId: value}

  // Fetch locations
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.error("fetchLocations error", error);
      return;
    }
    setLocations(data || []);
  };

  // Fetch all reviews and group by location_id
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("fetchReviews error", error);
      return;
    }
    const grouped = {};
    (data || []).forEach((r) => {
      grouped[r.location_id] = grouped[r.location_id] || [];
      grouped[r.location_id].push(r);
    });
    setReviewsByLocation(grouped);
  };

  useEffect(() => {
    fetchLocations();
    fetchReviews();

    // auth state
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    })();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // subscribe to realtime changes on locations and reviews -> refetch small
    const locSub = supabase
      .channel("public:locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, () => fetchLocations())
      .subscribe();

    const revSub = supabase
      .channel("public:reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetchReviews())
      .subscribe();

    return () => {
      supabase.removeChannel(locSub);
      supabase.removeChannel(revSub);
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // open reviews modal for a location
  const openReviews = (location) => {
    setSelectedLocation(location);
    setShowReviewsModal(true);
  };

  // callback to add review (insert into supabase)
  const handleAddReview = async (locationId, text) => {
    if (!text?.trim()) return;
    const { error } = await supabase.from("reviews").insert({ location_id: locationId, text: text.trim() });
    if (error) {
      console.error("add review error", error);
      alert("Failed to add review: " + error.message);
    } else {
      // realtime will update; optimistically update UI is optional
      // fetchReviews();
    }
  };

  // callback to add location (insert into supabase)
  const handleAddLocation = async (payload) => {
    // payload should match locations columns: type,name,lat,lng,address,hours,contact,available_beds,capacity,extra_food
    const { data, error } = await supabase.from("locations").insert(payload).select();
    if (error) {
      console.error("add location error", error);
      alert("Failed to add location: " + error.message);
      return false;
    }
    // success, realtime will update map automatically
    return true;
  };

  // update beds (authenticated users only)
  const handleUpdateBeds = async (locationId) => {
    if (!user) {
      alert("Please sign in to update beds.");
      return;
    }
    const value = editBedsValue[locationId];
    if (value == null || value === "") {
      alert("Enter a number");
      return;
    }
    const { error } = await supabase
      .from("locations")
      .update({ available_beds: parseInt(value, 10), updated_at: new Date() })
      .eq("id", locationId);
    if (error) {
      console.error("update beds error", error);
      alert("Failed to update beds: " + error.message);
      return;
    }
    setEditBedsValue((p) => ({ ...p, [locationId]: "" }));
    // realtime will refresh locations
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Floating Add Location (always visible) */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          zIndex: 1400,
          background: "#007bff",
          color: "white",
          padding: "12px 16px",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
        }}
      >
        ➕ Add Location
      </button>

      {/* Login indicator / quick link */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1400 }}>
        {user ? (
          <div style={{ background: "#0ea5a4", color: "white", padding: "6px 10px", borderRadius: 8 }}>
            Signed in
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
              style={{ marginLeft: 8, background: "transparent", color: "white", border: "none", cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
        ) : (
          <div style={{ background: "#f97316", color: "white", padding: "6px 10px", borderRadius: 8 }}>
            Not signed in
            <button
              onClick={() => setShowLoginModal(true)}
              style={{ marginLeft: 8, background: "transparent", color: "white", border: "none", cursor: "pointer" }}
            >
              Sign in
            </button>
          </div>
        )}
      </div>

      {/* AddLocation Modal */}
      <AddLocationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddLocation}
      />

      {/* Login Modal */}
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Reviews Modal */}
      <ReviewsModal
        open={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        location={selectedLocation}
        reviews={selectedLocation ? reviewsByLocation[selectedLocation.id] || [] : []}
        onAdd={(text) => {
          if (!selectedLocation) return;
          handleAddReview(selectedLocation.id, text);
        }}
      />

      {/* Map */}
      <MapContainer center={[32.7157, -117.1611]} zoom={12} style={{ height: "100vh", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup minWidth={260}>
              <div>
                <strong style={{ fontSize: 16 }}>{loc.name}</strong>
                <div style={{ color: "#666", marginTop: 4 }}>{loc.type}</div>
                <div style={{ marginTop: 8 }}>{loc.address}</div>
                {loc.contact && <div style={{ marginTop: 6 }}>📞 {loc.contact}</div>}
                {loc.type === "shelter" ? (
                  <div style={{ marginTop: 6 }}>🛏️ {loc.available_beds ?? 0} / {loc.capacity ?? "—"}</div>
                ) : (
                  <div style={{ marginTop: 6 }}>🍽️ {loc.extra_food ?? "Food available"}</div>
                )}
                {loc.hours && <div style={{ marginTop: 6 }}>⏰ {loc.hours}</div>}

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={() => openReviews(loc)} style={{ padding: "6px 8px" }}>
                    View Reviews
                  </button>
                </div>

                {/* edit beds inline only (UI) — user must be signed in to actually update (RLS) */}
                {loc.type === "shelter" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Edit beds (requires sign in)
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                      <input
                        type="number"
                        placeholder="# beds"
                        value={editBedsValue[loc.id] ?? ""}
                        onChange={(e) => setEditBedsValue((p) => ({ ...p, [loc.id]: e.target.value }))}
                        style={{ width: 100, padding: 6 }}
                      />
                      <button onClick={() => handleUpdateBeds(loc.id)} style={{ padding: "6px 8px" }}>
                        Update beds
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
