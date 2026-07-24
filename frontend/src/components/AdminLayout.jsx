import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Ringkasan', end: true },
  { to: '/admin/siswa', label: 'Data Siswa' },
  { to: '/admin/guru', label: 'Data Guru' },
  { to: '/admin/kelas', label: 'Data Kelas' },
  { to: '/admin/mapel', label: 'Mata Pelajaran' },
  { to: '/admin/jadwal', label: 'Jadwal Pelajaran' },
];

function AdminLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="text-xs text-slate-400">Aplikasi Sekolah</p>
          <p className="text-sm font-semibold text-slate-800">Panel Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 px-3 mb-2">{user?.nama}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition"
          >
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
