import React, { useState, useEffect } from "react";

/*
 Props:
  - open (bool)
  - onClose() 
  - onSubmit(payload) -> should return true/false or nothing. Modal will close on success.
*/

export default function AddLocationModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    type: "shelter",
    name: "",
    //lat: "",
    //lng: "",
    address: "",
    hours: "",
    contact: "",
    available_beds: "",
    capacity: "",
    extra_food: "", // food_available
  });

  useEffect(() => {
    if (!open) {
      setForm({
        type: "shelter",
        name: "",
        //lat: "",
        //lng: "",
        address: "",
        hours: "",
        contact: "",
        available_beds: "",
        capacity: "",
        extra_food: "",
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      type: form.type,
      name: form.name,
      //lat: parseFloat(form.lat),
      //lng: parseFloat(form.lng),
      address: form.address || null,
      hours: form.hours || null,
      contact: form.contact || null,
      available_beds: form.type === "shelter" ? (form.available_beds ? parseInt(form.available_beds, 10) : 0) : null,
      capacity: form.type === "shelter" ? (form.capacity ? parseInt(form.capacity, 10) : 0) : null,
      extra_food: form.type === "restaurant" ? form.extra_food || null : null,
    };

    const ok = await onSubmit(payload);
    if (ok !== false) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: "absolute",
      top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 2000,
      width: 360,
      background: "white",
      padding: 18,
      borderRadius: 12,
      boxShadow: "0 6px 20px rgba(0,0,0,0.25)"
    }}>
      <h3 style={{ marginTop: 0 }}>Add location</h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Type:
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="shelter">Shelter</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </label>

        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Name:
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>

        

        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Address:
          <input name="address" value={form.address} onChange={handleChange} />
        </label>

        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Contact:
          <input name="contact" value={form.contact} onChange={handleChange} />
        </label>

        <label style={{ display: "flex", justifyContent: "space-between" }}>
          Hours:
          <input name="hours" value={form.hours} onChange={handleChange} />
        </label>

        {form.type === "shelter" ? (
          <>
            <label style={{ display: "flex", justifyContent: "space-between" }}>
              Available beds:
              <input name="available_beds" value={form.available_beds} onChange={handleChange} />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between" }}>
              Capacity:
              <input name="capacity" value={form.capacity} onChange={handleChange} />
            </label>
          </>
        ) : (
          <label style={{ display: "flex", justifyContent: "space-between" }}>
            Food available:
            <input name="extra_food" value={form.extra_food} onChange={handleChange} placeholder="e.g. 20 meals" />
          </label>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 10px" }}>Cancel</button>
          <button type="submit" style={{ background: "#059669", color: "white", padding: "8px 10px", border: "none", borderRadius: 6 }}>
            Add to map
          </button>
        </div>
      </form>
    </div>
  );
}
