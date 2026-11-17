import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/landing/LandingPage";
import { NotFoundPage } from "./pages/not-found/NotFoundPage";
import { PreviewPage } from "./pages/preview/PreviewPage";
import { SharePage } from "./pages/share/SharePage";
import { SavedRecapPage } from "./pages/saved/SavedRecapPage";
import { CollectionPage } from "./pages/saved/CollectionPage";
import "./App.css";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route path="/r/:id" element={<SharePage />} />
      <Route path="/saved" element={<CollectionPage />} />
      <Route path="/saved/:videoId" element={<SavedRecapPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
