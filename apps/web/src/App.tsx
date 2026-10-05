import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/landing/LandingPage";
import { NotFoundPage } from "./pages/not-found/NotFoundPage";
import { PreviewPage } from "./pages/preview/PreviewPage";
import "./App.css";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
