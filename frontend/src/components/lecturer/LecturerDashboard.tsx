import React, { useState, useEffect } from 'react';
import { Meeting, DocumentItem } from '../../types';
import { uploadDocument, deleteDocument, fetchDocuments, fetchMeetings } from '../../services/api';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, RefreshCw, FolderPlus, Layers } from 'lucide-react';

export const LecturerDashboard: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [selectedMeeting, setSelectedMeeting] = useState<number>(1);
  const [topicInput, setTopicInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mList, dList] = await Promise.all([fetchMeetings(), fetchDocuments()]);
      setMeetings(mList);
      setDocuments(dList);
      
      const currentM = mList.find(m => m.number === selectedMeeting);
      if (currentM && !topicInput) {
        setTopicInput(currentM.topic);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const m = meetings.find(item => item.number === selectedMeeting);
    if (m) {
      setTopicInput(m.topic);
    }
  }, [selectedMeeting, meetings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.name.endsWith('.pdf')) {
        setError('Hanya file .pdf yang dapat diunggah.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(f);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Silakan pilih file PDF terlebih dahulu.');
      return;
    }
    if (!topicInput.trim()) {
      setError('Silakan isi topik/judul materi.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const newDoc = await uploadDocument(selectedFile, selectedMeeting, topicInput);
      setSuccessMsg(`Berhasil mengunggah ${newDoc.filename} (${newDoc.chunks_indexed} chunk terindeks)`);
      setSelectedFile(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah materi');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!window.confirm(`Hapus materi "${filename}" dari sistem RAG?`)) return;
    try {
      await deleteDocument(docId);
      setSuccessMsg(`Materi ${filename} telah dihapus.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus dokumen');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            👨‍🏫 Portal Pengelolaan Materi Perkuliahan Dosen
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Unggah slide PDF, modul, atau catatan perkuliahan per Pertemuan. Dokumen akan otomatis dibaca, di-chunk, dan diindeks ke dalam Vector Database Qdrant.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">Unggah Materi Baru</h3>
            <p className="text-xs text-slate-400">Format file: PDF (.pdf)</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pilih Pertemuan
              </label>
              <select
                value={selectedMeeting}
                onChange={(e) => setSelectedMeeting(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              >
                {meetings.map((m) => (
                  <option key={m.number} value={m.number}>
                    Pertemuan {m.number}: {m.topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Topik / Judul Materi
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Contoh: Apache Spark RDD & DataFrames"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                File PDF Materi
              </label>
              <label className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                <FileText className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mb-2 transition" />
                <span className="text-xs text-slate-300 font-medium">
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih file PDF'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Maksimal 50MB</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 text-sm transition"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Mengindeks ke Vector DB...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" /> Unggah &amp; Indeks Materi
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Daftar Materi Ter-indeks ({documents.length})</h3>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <FileText className="w-12 h-12 mx-auto stroke-1 opacity-50" />
            <p className="text-sm">Belum ada dokumen materi yang terindeks.</p>
            <p className="text-xs">Unggah file PDF di atas untuk mulai mengindeks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pertemuan</th>
                  <th className="py-3 px-4">Judul Dokumen</th>
                  <th className="py-3 px-4">Topik</th>
                  <th className="py-3 px-4 text-center">Chunks Indexed</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-amber-400 whitespace-nowrap">
                      Pertemuan {doc.meeting_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{doc.topic}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950 text-brand-400 border border-brand-500/30 font-mono font-bold">
                        {doc.chunks_indexed}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 transition"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
