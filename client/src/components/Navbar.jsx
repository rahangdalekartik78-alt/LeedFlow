// Top bar with brand, user initials and logout.
import { LogOut, Users } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-bold text-indigo-600"><Users size={20} />LeadFlow</div>
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{initials}</span>
          <span className="hidden text-sm sm:inline">{user.name}</span>
          <button className="btn-ghost !px-3" onClick={logout}><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button>
        </div>
      </div>
    </header>
  );
}
