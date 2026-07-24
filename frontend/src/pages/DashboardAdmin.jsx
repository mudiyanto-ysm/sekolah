import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

const menuCards = [
  { to: '/admin/siswa', title: 'Data Siswa', desc: 'Kelola data siswa: tambah, ubah, dan hapus.' },
  { to: '/admin/guru', title: 'Data Guru', desc: 'Kelola data guru dan penugasan mengajar.' },
  { to: '/admin/kelas', title: 'Data Kelas', desc: 'Kelola daftar kelas dan jurusan.' },
  { to: '/admin/mapel', title: 'Mata Pelajaran', desc: 'Kelola daftar mata pelajaran.' },
];

function DashboardAdmin() {
  return (
    <AdminLayout title="Ringkasan">
      <p className="text-slate-500 mb-6">
        Pilih menu di bawah ini untuk mengelola data sekolah.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition"
          >
            <h3 className="font-medium text-slate-800 mb-1">{card.title}</h3>
            <p className="text-sm text-slate-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}

export default DashboardAdmin;
