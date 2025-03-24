import "./index.css";
import { Route, Routes } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { awsConfig } from "./config/awsConfig";
import LandingPage from "./pages/landingPage/LandingPage";
import TestPage from "./pages/testPage/TestPage";
import ProfilePage from "./pages/profilePage/ProfilePage";
import MenuPage from "./pages/menuPage/MenuPage";
import ResultsPage from "./pages/resultsPage/ResultsPage";
import WritingTestPage from "./pages/writingTestPage.tsx/writingTest";
import WritingInputPage from "./pages/writingInputPage/writingInputPage";
import ReadingTestPage from "./pages/readingTestPage/ReadingTest";
import { AuthProvider } from "./contexts/AuthContext";

Amplify.configure(awsConfig);

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<MenuPage />} />
        <Route path="/history" element={<ResultsPage />} />
        <Route path="/writing" element={<WritingTestPage />} />
        <Route path="/writinginput" element={<WritingInputPage />} />
        <Route path="/reading" element={<ReadingTestPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
