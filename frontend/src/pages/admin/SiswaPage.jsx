import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import api from '../../api/client';

const emptyForm = {
  nama: '', email: '', password: '', nis: '',
  kelas_id: '', jurusan: '', jenis_kelamin: 'L', tanggal_lahir: '',
};

function SiswaPage() {
  const [siswaList, setSiswaList] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/siswa', { params: { search, page, limit: 10 } });
      setSiswaList(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Gagal memuat data siswa.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadKelasOptions() {
    try {
      const res = await api.get('/kelas');
      setKelasOptions(res.data.data);
    } catch (err) {
      // Diamkan — dropdown kelas tetap bisa kosong kalau gagal
    }
  }

  useEffect(() => {
    loadKelasOptions();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(siswa) {
    setEditingId(siswa.id);
    setForm({
      nama: siswa.nama,
      email: siswa.email,
      password: '',
      nis: siswa.nis,
      kelas_id: siswa.kelas_id || '',
      jurusan: siswa.jurusan || '',
      jenis_kelamin: siswa.jenis_kelamin || 'L',
      tanggal_lahir: siswa.tanggal_lahir || '',
    });
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const payload = { ...form };
      if (editingId && !payload.password) delete payload.password; // jangan ubah password kalau kosong

      if (editingId) {
        await api.put(`/siswa/${editingId}`, payload);
      } else {
        await api.post('/siswa', payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(siswa) {
    if (!confirm(`Hapus siswa "${siswa.nama}"? Akun login siswa ini juga akan terhapus.`)) return;
    try {
      await api.delete(`/siswa/${siswa.id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus siswa.');
    }
  }

  return (
    <AdminLayout title="Data Siswa">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NIS..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button type="submit" className="text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">
            Cari
          </button>
        </form>
        <button
          onClick={openAddModal}
          className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          + Tambah Siswa
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : siswaList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Tidak ada data siswa yang cocok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">NIS</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium">Jurusan</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaList.map((siswa) => (
                <tr key={siswa.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{siswa.nis}</td>
                  <td className="px-4 py-3 text-slate-800">{siswa.nama}</td>
                  <td className="px-4 py-3 text-slate-600">{siswa.nama_kelas || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{siswa.jurusan || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{siswa.email}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(siswa)} className="text-slate-600 hover:text-slate-900">
                      Ubah
                    </button>
                    <button onClick={() => handleDelete(siswa)} className="text-red-600 hover:text-red-800">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
          <span>Halaman {page} dari {pagination.totalPages} ({pagination.total} siswa)</span>
          <div className="space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      <Modal title={editingId ? 'Ubah Siswa' : 'Tambah Siswa'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text" required value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIS</label>
              <input
                type="text" required value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={form.jenis_kelamin}
                onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {editingId && <span className="text-slate-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <input
              type="password" required={!editingId} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
              <select
                value={form.kelas_id}
                onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">- Pilih kelas -</option>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan</label>
              <select
                value={form.jurusan}
                onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">-</option>
                <option value="IPA">IPA</option>
                <option value="IPS">IPS</option>
                <option value="Bahasa">Bahasa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
            <input
              type="date" value={form.tanggal_lahir}
              onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <button
            type="submit" disabled={isSaving}
            className="w-full bg-slate-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}

export default SiswaPage;
