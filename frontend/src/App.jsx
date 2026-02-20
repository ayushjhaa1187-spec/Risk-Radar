import { Routes, Route, Link } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
      <div className="card max-w-md space-y-4 p-8">
        <p className="pill w-fit bg-[rgba(239,68,68,0.15)] text-rose-300">404</p>
        <h1 className="text-2xl font-display font-semibold text-white">Page not found</h1>
        <p className="text-slate-300">The page you are looking for doesn&apos;t exist. Navigate back to the dashboard.</p>
        <Link className="btn-primary w-full sm:w-auto" to="/dashboard">Go to Dashboard</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}
