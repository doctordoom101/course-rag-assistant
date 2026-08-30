import React from 'react';
import { UserRole } from '../types';
import { Sparkles, GraduationCap, BookOpenCheck, Zap } from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ role, onRoleChange }) => {
  return (
    <header className="border-b border-[#1e1f20] bg-[#131314]/90 backdrop-blur-xl sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 via-purple-500 to-pink-500 p-[1.5px] shadow-lg shadow-sky-500/10 flex items-center justify-center">
          <div className="w-full h-full bg-[#131314] rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm md:text-base text-[#e3e3e3] tracking-tight">
              Big Data <span className="gemini-blue-gradient-text font-bold">AI Assistant</span>
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e1f20] text-sky-400 border border-sky-500/20 flex items-center gap-1">
              <Zap className="w-3 h-3 text-sky-400" /> Gemini RAG
            </span>
          </div>
        </div>
      </div>

      {/* Role Switcher Toggle (Minimalist Gemini Style) */}
      <div className="flex items-center bg-[#1e1f20] p-1 rounded-full border border-white/5 shadow-inner">
        <button
          onClick={() => onRoleChange('student')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            role === 'student'
              ? 'bg-[#28292a] text-sky-300 font-semibold shadow-sm border border-white/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#28292a]/50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Mahasiswa</span>
        </button>
        <button
          onClick={() => onRoleChange('lecturer')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            role === 'lecturer'
              ? 'bg-[#28292a] text-amber-300 font-semibold shadow-sm border border-white/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#28292a]/50'
          }`}
        >
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>Dosen</span>
        </button>
      </div>
    </header>
  );
};
