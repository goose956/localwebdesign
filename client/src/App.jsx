import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import ChatWidget from './components/ChatWidget.jsx';

import Home       from './pages/Home.jsx';
import Pricing    from './pages/Pricing.jsx';
import Portfolio  from './pages/Portfolio.jsx';
import Contact    from './pages/Contact.jsx';
import StartProject from './pages/StartProject.jsx';

import AdminLogin        from './admin/AdminLogin.jsx';
import AdminLayout       from './admin/AdminLayout.jsx';
import ProtectedRoute    from './admin/ProtectedRoute.jsx';
import Dashboard         from './admin/Dashboard.jsx';
import ThemeBuilder      from './admin/ThemeBuilder.jsx';
import ContactMessages   from './admin/ContactMessages.jsx';
import PortfolioManager  from './admin/PortfolioManager.jsx';
import ReviewsManager    from './admin/ReviewsManager.jsx';
import ChatKnowledge     from './admin/ChatKnowledge.jsx';
import Settings          from './admin/Settings.jsx';
import ChatLogs          from './admin/ChatLogs.jsx';
import BriefManager      from './admin/BriefManager.jsx';
import Clients           from './admin/Clients.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<Home />} />
            <Route path="/pricing"       element={<Pricing />} />
            <Route path="/portfolio"     element={<Portfolio />} />
            <Route path="/contact"       element={<Contact />} />
            <Route path="/start-project" element={<StartProject />} />

            {/* Admin login */}
            <Route path="/admin" element={<AdminLogin />} />

            {/* Admin panel (protected) */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="themes"     element={<ThemeBuilder />} />
              <Route path="messages"   element={<ContactMessages />} />
              <Route path="portfolio"  element={<PortfolioManager />} />
              <Route path="reviews"    element={<ReviewsManager />} />
              <Route path="chatbot"    element={<ChatKnowledge />} />
              <Route path="settings"   element={<Settings />} />
              <Route path="chat-logs"  element={<ChatLogs />} />
              <Route path="clients"    element={<Clients />} />
              <Route path="briefs"      element={<BriefManager />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global chat widget — shown on all public pages */}
          <ChatWidget />
        </BrowserRouter>
      </ChatProvider>
    </ThemeProvider>
  );
}
