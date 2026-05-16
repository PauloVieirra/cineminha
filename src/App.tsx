import { Route, Routes } from "react-router-dom";
import { GestorUnlockedGuard } from "./components/GestorUnlockedGuard";
import { GuestGuard } from "./components/GuestGuard";
import { ManagerGuard } from "./components/ManagerGuard";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilesPage } from "./pages/ProfilesPage";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { ChildHome } from "./pages/ChildHome";
import { ChildWatch } from "./pages/ChildWatch";
import { ChildChannelPage } from "./pages/ChildChannelPage";
import { ManagerChannelPage } from "./pages/ManagerChannelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestGuard />}>
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/entrar" element={<LoginPage />} />
      </Route>

      <Route element={<ManagerGuard />}>
        <Route path="/perfis" element={<ProfilesPage />} />
        <Route element={<GestorUnlockedGuard />}>
          <Route path="/gestor" element={<ManagerDashboard />} />
          <Route path="/gestor/canal/:channelId" element={<ManagerChannelPage />} />
        </Route>
      </Route>

      <Route path="/assistir/:childId" element={<ChildHome />} />
      <Route path="/assistir/:childId/video/:videoId" element={<ChildWatch />} />
      <Route path="/assistir/:childId/yt/:youtubeId" element={<ChildWatch />} />
      <Route path="/assistir/:childId/canal/:channelId" element={<ChildChannelPage />} />
    </Routes>
  );
}
