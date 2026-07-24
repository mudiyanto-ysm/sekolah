import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabel = {
  admin: 'Admin',
  guru: 'Guru',
  siswa: 'Siswa',
};

function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Aplikasi Manajemen Sekolah</p>
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user?.nama}</p>
              <p className="text-xs text-slate-400">{roleLabel[user?.role] || user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

export default DashboardLayout;
