import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/home/HomePage";
import { VideoDetailPage } from "./pages/video-detail/VideoDetailPage";
import "./App.css";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/videos/:youtubeVideoId" element={<VideoDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
