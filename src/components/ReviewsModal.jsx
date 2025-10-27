import React, { useState, useEffect } from "react";

/*
 Props:
  - open (bool)
  - onClose()
  - location (object)  // the location row
  - reviews (array) // array of review rows for this location
  - onAdd(text) -> inserts a review (returns promise or not)
*/

export default function ReviewsModal({ open, onClose, location, reviews = [], onAdd }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  if (!open || !location) return null;

  return (
    <div style={{
      position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      zIndex: 2200, width: 560, maxHeight: "80vh", overflowY: "auto",
      background: "white", padding: 18, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{location.name} — Reviews</h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: "#666" }}>{location.address}</div>
        {location.type === "shelter" ? (
          <div style={{ marginTop: 6 }}>🛏️ {location.available_beds ?? 0} / {location.capacity ?? "—"}</div>
        ) : (
          <div style={{ marginTop: 6 }}>🍽️ {location.extra_food ?? "Food available"}</div>
        )}
        {location.hours && <div style={{ marginTop: 6 }}>⏰ {location.hours}</div>}
      </div>

      <hr style={{ margin: "12px 0" }} />

      <div>
        <strong>Community Reviews</strong>
        <div style={{ marginTop: 8 }}>
          {reviews.length === 0 ? (
            <div style={{ fontStyle: "italic" }}>No reviews yet.</div>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {reviews.map((r) => (
                <li key={r.id ?? Math.random()} style={{ marginBottom: 8 }}>
                  <div>{r.text}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{new Date(r.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <textarea
          placeholder="Write a short review..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", minHeight: 80, padding: 8 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: "8px 12px" }}>Close</button>
          <button onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(""); } }} style={{ background: "#2563eb", color: "white", padding: "8px 12px", border: "none", borderRadius: 6 }}>
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}
