import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Meeting, ChatMessage, SourceItem } from '../../types';
import { fetchMeetings, sendChatMessage, generateQuiz } from '../../services/api';
import {
  Sparkles,
  Send,
  User,
  BookOpen,
  Filter,
  CheckCircle2,
  FileText,
  Lightbulb,
  Award,
  Sliders,
  ExternalLink,
  Layers,
  ArrowRight,
  Database,
  Bot
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingFilters, setSelectedMeetingFilters] = useState<number[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [explanationLevel, setExplanationLevel] = useState<string>('normal');
  const [mode, setMode] = useState<'chat' | 'study' | 'quiz'>('chat');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Quiz state
  const [quizMeeting, setQuizMeeting] = useState<number>(1);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<{
    topic: string;
    content: string;
    sources: SourceItem[];
  } | null>(null);

  // Source preview modal state
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

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    setInputMessage('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      meeting_filters: selectedMeetingFilters,
      explanation_level: explanationLevel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: text,
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

  const promptSuggestions = [
    {
      title: "Perbedaan Hadoop & Spark",
      query: "Apa perbedaan utama antara Apache Hadoop dan Apache Spark?",
      icon: "⚡",
    },
    {
      title: "Konsep MapReduce (Pertemuan 6)",
      query: "Jelaskan konsep MapReduce dan proses Mapper/Reducer.",
      icon: "📦",
    },
    {
      title: "Penyimpanan HDFS (Pertemuan 4)",
      query: "Bagaimana cara kerja HDFS dalam mengelola penyimpanan terdistribusi?",
      icon: "💾",
    },
    {
      title: "Latihan Soal Big Data",
      query: "Buatkan 5 soal latihan pilihan ganda tentang materi Big Data.",
      icon: "📝",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] bg-[#0e0e11] text-[#e3e3e3] overflow-hidden">
      {/* Top Secondary Nav: Mode Switcher & Explanation Level */}
      <div className="px-4 md:px-8 py-2.5 bg-[#131314]/80 border-b border-[#1e1f20] flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Mode Switcher Pills */}
        <div className="flex items-center bg-[#1e1f20] p-1 rounded-full border border-white/5">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              mode === 'chat' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Q&amp;A Chat
          </button>
          <button
            onClick={() => setMode('study')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              mode === 'study' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" /> Study Mode (Sokratik)
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              mode === 'quiz' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Generate Quiz
          </button>
        </div>

        {/* Meeting Filter Badge & Explanation Level */}
        {mode !== 'quiz' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Level:</span>
              <div className="flex items-center bg-[#1e1f20] p-0.5 rounded-full border border-white/5 text-[11px]">
                {(['normal', 'beginner', 'advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setExplanationLevel(lvl)}
                    className={`px-2.5 py-0.5 rounded-full font-semibold capitalize transition ${
                      explanationLevel === lvl
                        ? 'bg-[#28292a] text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl === 'beginner' ? 'ELI5' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal & Expandable Meeting Filter Chips */}
      <div className="px-4 md:px-8 py-2 bg-[#131314]/60 border-b border-[#1e1f20] transition-all duration-300">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter Pertemuan Materi ({meetings.length})
            </span>
            {selectedMeetingFilters.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {selectedMeetingFilters.length} Terpilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedMeetingFilters.length > 0 && (
              <button
                onClick={clearMeetingFilters}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
              >
                Reset Filter
              </button>
            )}
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#1e1f20] hover:bg-[#28292a] text-slate-300 flex items-center gap-1 transition border border-white/5"
            >
              <span>{isFilterExpanded ? 'Ringkas' : 'Tampilkan Semua'}</span>
              <span className="text-xs">{isFilterExpanded ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        {/* Chips Container: Flex Wrap when expanded, overflow-x-auto when collapsed */}
        <div
          className={`py-1 gap-1.5 transition-all duration-300 ${
            isFilterExpanded
              ? 'flex flex-wrap max-h-48 overflow-y-auto'
              : 'flex items-center overflow-x-auto no-scrollbar'
          }`}
        >
          <button
            onClick={clearMeetingFilters}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 flex items-center gap-1 ${
              selectedMeetingFilters.length === 0
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-[#1e1f20] text-slate-400 hover:text-slate-200 hover:bg-[#28292a]'
            }`}
          >
            <span>✨ Semua Pertemuan</span>
          </button>

          {meetings.map((m) => {
            const isSelected = selectedMeetingFilters.includes(m.number);
            return (
              <button
                key={m.number}
                onClick={() => toggleMeetingFilter(m.number)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
                    : 'bg-[#1e1f20] text-slate-400 hover:text-slate-200 hover:bg-[#28292a]'
                }`}
              >
                <span>P{m.number}: {m.topic}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Canvas */}
      {mode === 'quiz' ? (
        /* Quiz Generation View */
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-[#131314] p-6 rounded-3xl border border-[#1e1f20] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#1e1f20] pb-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base md:text-lg">Generate Quiz Latihan Soal</h3>
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
                  className="w-full bg-[#0e0e11] border border-[#1e1f20] rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
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
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {quizLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Meng-generate Soal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Buat 5 Soal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {quizData && (
            <div className="bg-[#131314] p-6 rounded-3xl border border-[#1e1f20] shadow-2xl space-y-6">
              <h4 className="font-bold text-[#e3e3e3] border-b border-[#1e1f20] pb-3 text-base flex items-center gap-2">
                <span>📝 Latihan Soal: {quizData.topic}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-normal">
                  Pertemuan {quizMeeting}
                </span>
              </h4>

              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{quizData.content}</ReactMarkdown>
              </div>

              {quizData.sources && quizData.sources.length > 0 && (
                <div className="border-t border-[#1e1f20] pt-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Sumber Rujukan Soal:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quizData.sources.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSource(s)}
                        className="px-3 py-1.5 rounded-xl bg-[#0e0e11] hover:bg-[#1e1f20] border border-[#1e1f20] text-xs text-purple-300 flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
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
        /* Q&A Chat & Study Mode Canvas */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Empty Welcome State (Google Gemini Style Hero) */}
          {messages.length === 0 ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1f20] border border-white/5 text-xs text-slate-300 shadow-sm mb-2">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                  <span>Big Data Grounded Teaching Assistant</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#e3e3e3]">
                  Halo, <span className="gemini-blue-gradient-text">Mahasiswa!</span>
                </h2>
                <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto">
                  Mau belajar konsep Big Data apa hari ini? Tanyakan materi perkuliahan dengan sitasi dokumen presisi.
                </p>
              </div>

              {/* Gemini Quick Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="p-4 rounded-2xl bg-[#131314] hover:bg-[#1e1f20] border border-[#1e1f20] hover:border-sky-500/40 text-left transition group space-y-2 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{item.icon}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition transform group-hover:translate-x-0.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#e3e3e3] group-hover:text-sky-300 transition">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.query}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message Stream */
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 md:gap-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Gemini Assistant Sparkle Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-2xl bg-[#1e1f20] border border-white/10 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                    </div>
                  )}

                  <div
                    className={`space-y-3 max-w-[88%] md:max-w-[82%] ${
                      msg.role === 'user'
                        ? 'bg-[#28292a] text-[#e3e3e3] p-4 rounded-3xl rounded-tr-sm border border-white/5 shadow-md'
                        : 'bg-[#131314] text-[#e3e3e3] p-5 rounded-3xl rounded-tl-sm border border-[#1e1f20] shadow-xl'
                    }`}
                  >
                    <div className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Source Badges */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="border-t border-[#1e1f20] pt-3 mt-3 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-sky-400" /> Sumber Dokumen Rujukan:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveSource(src)}
                              className="px-3 py-1 rounded-full bg-[#0e0e11] hover:bg-[#1e1f20] border border-[#1e1f20] text-[11px] text-sky-300 flex items-center gap-1.5 transition group"
                            >
                              <FileText className="w-3 h-3 text-sky-400 group-hover:scale-110 transition" />
                              <span>
                                Pertemuan {src.meeting_number} &bull; {src.filename} (Hal {src.page_label})
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 font-mono text-right">{msg.timestamp}</div>
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-2xl bg-[#1e1f20] border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-4xl mx-auto items-center text-slate-400 text-xs font-medium">
                  <div className="w-8 h-8 rounded-2xl bg-[#1e1f20] border border-white/10 flex items-center justify-center text-sky-400 shadow-md">
                    <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="gemini-blue-gradient-text font-semibold">Gemini AI</span>
                    <span className="text-slate-400">sedang mencari rujukan &amp; menyusun jawaban...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Gemini Floating Pill Prompt Bar */}
          <div className="p-4 bg-gradient-to-t from-[#0e0e11] via-[#0e0e11]/90 to-transparent">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-4xl mx-auto bg-[#1e1f20] hover:bg-[#252628] focus-within:bg-[#28292a] border border-white/10 focus-within:border-sky-500/50 rounded-full p-2 pl-5 flex items-center gap-3 transition-all duration-300 shadow-2xl gemini-pill-glow"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  mode === 'study'
                    ? 'Tanyakan konsep atau jawab pertanyaan Sokratik...'
                    : 'Tanyakan sesuatu tentang materi Big Data...'
                }
                className="flex-1 bg-transparent text-xs md:text-sm text-[#e3e3e3] placeholder-slate-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 disabled:opacity-30 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Source Preview Modal (Gemini Style) */}
      {activeSource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#131314] border border-[#1e1f20] rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e1f20] pb-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
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
                <span className="text-sky-400 font-mono font-bold">Halaman {activeSource.page_label}</span>
              </div>
            </div>

            <div className="border border-[#1e1f20] bg-[#0e0e11] p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Snippet Konteks Teks:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {activeSource.snippet}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSource(null)}
                className="px-5 py-2 bg-[#1e1f20] hover:bg-[#28292a] text-white rounded-full text-xs font-semibold transition"
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
