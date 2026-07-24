import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import api from '../../api/client';

const emptyForm = { nama_kelas: '', tingkat: 'X', jurusan: '' };

function KelasPage() {
  const [kelasList, setKelasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/kelas');
      setKelasList(res.data.data);
    } catch (err) {
      setError('Gagal memuat data kelas.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(kelas) {
    setEditingId(kelas.id);
    setForm({ nama_kelas: kelas.nama_kelas, tingkat: kelas.tingkat, jurusan: kelas.jurusan || '' });
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/kelas/${editingId}`, form);
      } else {
        await api.post('/kelas', form);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(kelas) {
    if (!confirm(`Hapus kelas "${kelas.nama_kelas}"?`)) return;
    try {
      await api.delete(`/kelas/${kelas.id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kelas.');
    }
  }

  return (
    <AdminLayout title="Data Kelas">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{kelasList.length} kelas terdaftar</p>
        <button
          onClick={openAddModal}
          className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          + Tambah Kelas
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : kelasList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Belum ada data kelas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Kelas</th>
                <th className="px-4 py-3 font-medium">Tingkat</th>
                <th className="px-4 py-3 font-medium">Jurusan</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kelasList.map((kelas) => (
                <tr key={kelas.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{kelas.nama_kelas}</td>
                  <td className="px-4 py-3 text-slate-600">{kelas.tingkat}</td>
                  <td className="px-4 py-3 text-slate-600">{kelas.jurusan || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(kelas)} className="text-slate-600 hover:text-slate-900">
                      Ubah
                    </button>
                    <button onClick={() => handleDelete(kelas)} className="text-red-600 hover:text-red-800">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal title={editingId ? 'Ubah Kelas' : 'Tambah Kelas'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
            <input
              type="text"
              required
              value={form.nama_kelas}
              onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })}
              placeholder="contoh: X IPA 1"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat</label>
            <select
              value={form.tingkat}
              onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="X">X</option>
              <option value="XI">XI</option>
              <option value="XII">XII</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan (opsional)</label>
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

          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-slate-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}

export default KelasPage;
