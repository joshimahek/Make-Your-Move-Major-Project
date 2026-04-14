/**
 * App shell with progress bar and route definitions.
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AssessmentProvider } from './context/AssessmentContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import ContextIntake from './pages/ContextIntake';
import ActivityRouter from './pages/activities/ActivityRouter';
import ThinkingStyles from './pages/ThinkingStyles';
import Results from './pages/Results';
import Roadmap from './pages/Roadmap';
import Login from './pages/Login';
import Signup from './pages/Signup';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route path="/context" element={<Layout><ContextIntake /></Layout>} />
        <Route path="/activity/:activityNumber" element={<Layout><ActivityRouter /></Layout>} />
        <Route path="/thinking-styles" element={<Layout><ThinkingStyles /></Layout>} />
        <Route path="/results" element={<Layout><Results /></Layout>} />
        <Route path="/roadmap/:domain" element={<Layout><Roadmap /></Layout>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <div className="bg-mesh" />
        <AnimatedRoutes />
      </AssessmentProvider>
    </BrowserRouter>
  );
}
