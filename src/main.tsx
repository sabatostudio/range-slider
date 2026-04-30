import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { Gallery } from "./gallery/Gallery";
import { Lab } from "./lab/Lab";
import { Solo } from "./lab/Solo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/p/:slug" element={<Lab />} />
        <Route path="/solo/:slug" element={<Solo />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
