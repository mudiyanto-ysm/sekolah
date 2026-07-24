import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500 mb-4">Kamu tidak memiliki izin untuk membuka halaman ini.</p>
        <Link to="/login" className="text-sm text-slate-700 underline">
          Kembali ke halaman login
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;
