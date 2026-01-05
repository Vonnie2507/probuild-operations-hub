import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Prestart from './pages/Prestart';
import PrestartDetail from './pages/PrestartDetail';
import Templates from './pages/Templates';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/prestart" element={<Prestart />} />
          <Route path="/prestart/:id" element={<PrestartDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/schedule" element={<ComingSoon title="Schedule" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p>Coming soon...</p>
    </div>
  );
}

export default App;
