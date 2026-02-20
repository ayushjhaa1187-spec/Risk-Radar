import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(148,163,184,0.15)] bg-[rgba(11,18,32,0.9)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p>Built for procurement, resilience, and geopolitical signal coverage.</p>
        <div className="flex items-center gap-4">
          <a className="hover:text-white" href="https://github.com/yourusername/Risk-Radar" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="hover:text-white" href="https://github.com/yourusername/Risk-Radar/tree/main/docs" target="_blank" rel="noreferrer">
            Docs
          </a>
          <Link className="hover:text-white" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
