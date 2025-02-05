import "./index.css";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import TestPage from "./pages/testPage/TestPage";
import ProfilePage from "./pages/profilePage/ProfilePage";

// import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    // <AuthProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
    // </AuthProvider>
  );
}

export default App;
