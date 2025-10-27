import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapView />} />
      </Routes>
    </BrowserRouter>
  );
}
