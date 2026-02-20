import { Link, useLocation } from 'react-router-dom';
import { ShieldHalf, Github } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Why Tier-N', to: '#why' },
  { label: 'Docs', href: 'https://github.com/yourusername/Risk-Radar/tree/main/docs' },
];

export default function NavBar() {
  const { pathname, hash } = useLocation();
  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(148,163,184,0.2)] bg-[rgba(11,18,32,0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(234,88,12,0.12)] text-brand-400">
            <ShieldHalf size={22} strokeWidth={1.7} />
          </div>
          <div className="leading-tight">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Tier-N</div>
            <div className="font-display text-lg font-semibold text-white">Risk Radar</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-semibold text-slate-200 sm:flex">
          {navItems.map((item) => {
            const isActive = item.to
              ? item.to.startsWith('#')
                ? hash === item.to
                : pathname === item.to
              : false;
            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3 py-2 transition hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={clsx(
                  'rounded-full px-3 py-2 transition hover:text-white',
                  isActive && 'bg-[rgba(148,163,184,0.15)] text-white',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            className="btn-ghost hidden sm:inline-flex"
            href="https://github.com/yourusername/Risk-Radar"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} />
            Repo
          </a>
          <Link to="/dashboard" className="btn-primary">
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
