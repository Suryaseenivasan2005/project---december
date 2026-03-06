import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import DSA from './pages/DSA';
import DocumentVault from './pages/DocumentVault';
import Reading from './pages/Reading';
import Portfolio from './pages/Portfolio';
import {
  MailPage,
  ClientsPage,
  AssistantPage,
  AutomationPage,
} from './pages/PlaceholderPages';

const pageMap = {
  dashboard: <Dashboard />,
  projects: <Projects />,
  dsa: <DSA />,
  documents: <DocumentVault />,
  mail: <MailPage />,
  clients: <ClientsPage />,
  reading: <Reading />,
  portfolio: <Portfolio />,
  assistant: <AssistantPage />,
  automation: <AutomationPage />,
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-content">
        <Topbar activePage={activePage} />
        {pageMap[activePage]}
      </div>
    </div>
  );
}
