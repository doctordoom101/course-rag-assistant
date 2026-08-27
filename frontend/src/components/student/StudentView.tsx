import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Meeting, ChatMessage, SourceItem } from '../../types';
import { fetchMeetings, sendChatMessage, generateQuiz } from '../../services/api';
import {
  Send,
  Bot,
  User,
  BookOpen,
  HelpCircle,
  Sparkles,
  Filter,
  CheckCircle,
  FileText,
  BrainCircuit,
  Lightbulb,
  ExternalLink,
  RefreshCw,
  Sliders,
  Award
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingFilters, setSelectedMeetingFilters] = useState<number[]>([]);
  const [explanationLevel, setExplanationLevel] = useState<string>('normal');
  const [mode, setMode] = useState<'chat' | 'study' | 'quiz'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Halo! Saya adalah **AI Teaching Assistant Mata Kuliah Big Data**.\n\nSaya siap membantu menjawab pertanyaan Anda, memberikan penjelasan konsep (Hadoop, MapReduce, HDFS, Spark, NoSQL, EDA), atau membuatkan soal latihan.\n\n*Semua jawaban saya dijamin 100% bersumber dari materi perkuliahan yang diunggah oleh Dosen.*',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Quiz State
  const [quizMeeting, setQuizMeeting] = useState<number>(1);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<{
    topic: string;
    content: string;
    sources: SourceItem[];
  } | null>(null);

  // Modal Source preview state
  const [activeSource, setActiveSource] = useState<SourceItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMeetings()
      .then((data) => setMeetings(data))
      .catch((err) => console.error('Failed fetching meetings:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleMeetingFilter = (num: number) => {
    if (selectedMeetingFilters.includes(num)) {
      setSelectedMeetingFilters(selectedMeetingFilters.filter((m) => m !== num));
    } else {
      setSelectedMeetingFilters([...selectedMeetingFilters, num]);
    }
  };

  const clearMeetingFilters = () => {
    setSelectedMeetingFilters([]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      meeting_filters: selectedMeetingFilters,
      explanation_level: explanationLevel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: userText,
        meeting_filters: selectedMeetingFilters,
        explanation_level: explanationLevel,
        mode: mode,
        conversation_id: conversationId,
      });

      setConversationId(res.conversation_id);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Gagal menghubungi AI Assistant backend.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    try {
      const res = await generateQuiz(quizMeeting, 5);
      setQuizData({
        topic: res.topic,
        content: res.quiz_content,
        sources: res.sources,
      });
    } catch (err: any) {
      alert(`Gagal membuat kuis: ${err.message}`);
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden bg-slate-950">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-300">Filter Pertemuan</h2>
          </div>
          {selectedMeetingFilters.length > 0 && (
            <button
              onClick={clearMeetingFilters}
              className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={clearMeetingFilters}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
              selectedMeetingFilters.length === 0
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <span>✨ Semua Pertemuan</span>
            {selectedMeetingFilters.length === 0 && <CheckCircle className="w-3.5 h-3.5 text-brand-400" />}
          </button>

          <div className="pt-2 pb-1 px-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Materi Spesifik:
          </div>

          {meetings.map((m) => {
            const isSelected = selectedMeetingFilters.includes(m.number);
            return (
              <button
                key={m.number}
                onClick={() => toggleMeetingFilter(m.number)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                  isSelected
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-white">Pertemuan {m.number}:</span>{' '}
                  <span className="text-slate-400">{m.topic}</span>
                </div>
                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Top Control Bar */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === 'chat' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Q&amp;A Chat
            </button>
            <button
              onClick={() => setMode('study')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === 'study' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" /> Study Mode (Tutor)
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === 'quiz' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Generate Quiz
            </button>
          </div>

          {/* Explanation Level Selector */}
          {mode !== 'quiz' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-brand-400" /> Tingkat Penjelasan:
              </span>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                {(['normal', 'beginner', 'advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setExplanationLevel(lvl)}
                    className={`px-2.5 py-1 rounded-md font-semibold capitalize transition ${
                      explanationLevel === lvl
                        ? 'bg-slate-800 text-brand-400 border border-brand-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl === 'beginner' ? 'ELI5 (Pemula)' : lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Content */}
        {mode === 'quiz' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Generate Quiz Latihan Soal</h3>
                  <p className="text-xs text-slate-400">
                    Buat 5 soal pilihan ganda interaktif yang bersumber dari materi perkuliahan terpilih.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pilih Pertemuan Materi:
                  </label>
                  <select
                    value={quizMeeting}
                    onChange={(e) => setQuizMeeting(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {meetings.map((m) => (
                      <option key={m.number} value={m.number}>
                        Pertemuan {m.number}: {m.topic}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
                >
                  {quizLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Meng-generate Soal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Buatkan 5 Soal
                    </>
                  )}
                </button>
              </div>
            </div>

            {quizData && (
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                <h4 className="font-bold text-lg text-purple-300 border-b border-slate-800 pb-3">
                  📝 Latihan Soal: {quizData.topic} (Pertemuan {quizMeeting})
                </h4>

                <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{quizData.content}</ReactMarkdown>
                </div>

                {quizData.sources && quizData.sources.length > 0 && (
                  <div className="border-t border-slate-800 pt-4 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Sumber Materi Soal:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {quizData.sources.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSource(s)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-purple-300 flex items-center gap-1.5 transition"
                        >
                          <FileText className="w-3 h-3 text-purple-400" />
                          <span>
                            {s.filename} (Hal {s.page_label})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Chat & Study Mode Canvas */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-brand-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`space-y-3 max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-brand-600/10'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl rounded-tl-none shadow-xl'
                    }`}
                  >
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Sources Badge List */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="border-t border-slate-800/80 pt-3 mt-3 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-brand-400" /> Sumber Jawaban Materi:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveSource(src)}
                              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-brand-300 flex items-center gap-2 transition group"
                            >
                              <FileText className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition" />
                              <span className="font-semibold">
                                Pertemuan {src.meeting_number} &bull; {src.filename} (Hal {src.page_label})
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 text-right font-mono">{msg.timestamp}</div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-4xl mx-auto items-center text-slate-400 text-xs font-semibold animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Mencari rujukan materi &amp; menyusun jawaban...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    mode === 'study'
                      ? 'Tanyakan konsep atau jawab pertanyaan Sokratik AI...'
                      : 'Tanyakan sesuatu tentang materi Big Data (misal: "Apa perbedaan Hadoop dan Spark?")...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="px-5 py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 flex items-center justify-center transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Source Modal */}
      {activeSource && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>Rujukan Dokumen Sumber</span>
              </div>
              <button
                onClick={() => setActiveSource(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 uppercase tracking-wider font-bold">Nama File:</span>{' '}
                <span className="text-white font-semibold">{activeSource.filename}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider font-bold">Pertemuan:</span>{' '}
                <span className="text-amber-400 font-semibold">Pertemuan {activeSource.meeting_number}</span>
              </div>
              {activeSource.topic && (
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-bold">Topik:</span>{' '}
                  <span className="text-slate-300">{activeSource.topic}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 uppercase tracking-wider font-bold">Halaman:</span>{' '}
                <span className="text-brand-400 font-mono font-bold">Halaman {activeSource.page_label}</span>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Snippet Konteks Teks:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {activeSource.snippet}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSource(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
