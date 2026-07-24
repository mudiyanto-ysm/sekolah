import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import api from '../../api/client';

const emptyForm = { nama_mapel: '', kode_mapel: '' };

function MapelPage() {
  const [mapelList, setMapelList] = useState([]);
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
      const res = await api.get('/mapel');
      setMapelList(res.data.data);
    } catch (err) {
      setError('Gagal memuat data mata pelajaran.');
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

  function openEditModal(mapel) {
    setEditingId(mapel.id);
    setForm({ nama_mapel: mapel.nama_mapel, kode_mapel: mapel.kode_mapel });
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/mapel/${editingId}`, form);
      } else {
        await api.post('/mapel', form);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(mapel) {
    if (!confirm(`Hapus mata pelajaran "${mapel.nama_mapel}"?`)) return;
    try {
      await api.delete(`/mapel/${mapel.id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus mapel.');
    }
  }

  return (
    <AdminLayout title="Mata Pelajaran">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{mapelList.length} mata pelajaran terdaftar</p>
        <button
          onClick={openAddModal}
          className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          + Tambah Mapel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : mapelList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Belum ada data mata pelajaran.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Mapel</th>
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mapelList.map((mapel) => (
                <tr key={mapel.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{mapel.nama_mapel}</td>
                  <td className="px-4 py-3 text-slate-600">{mapel.kode_mapel}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(mapel)} className="text-slate-600 hover:text-slate-900">
                      Ubah
                    </button>
                    <button onClick={() => handleDelete(mapel)} className="text-red-600 hover:text-red-800">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal title={editingId ? 'Ubah Mapel' : 'Tambah Mapel'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mata Pelajaran</label>
            <input
              type="text"
              required
              value={form.nama_mapel}
              onChange={(e) => setForm({ ...form, nama_mapel: e.target.value })}
              placeholder="contoh: Matematika"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kode Mapel</label>
            <input
              type="text"
              required
              value={form.kode_mapel}
              onChange={(e) => setForm({ ...form, kode_mapel: e.target.value.toUpperCase() })}
              placeholder="contoh: MTK"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
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

export default MapelPage;
