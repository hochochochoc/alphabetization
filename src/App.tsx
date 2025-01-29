import "./index.css";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";

// import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    // <AuthProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
    // </AuthProvider>
  );
}

export default App;
