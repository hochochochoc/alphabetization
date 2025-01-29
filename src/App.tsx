import "./index.css";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import TestPage from "./pages/testPage/TestPage";


// import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    // <AuthProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
    // </AuthProvider>
  );
}

export default App;
