import React, { useState } from 'react';
import { UserRole } from './types';
import { Header } from './components/Header';
import { StudentView } from './components/student/StudentView';
import { LecturerDashboard } from './components/lecturer/LecturerDashboard';

export const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('student');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Header role={role} onRoleChange={setRole} />
      {role === 'student' ? <StudentView /> : <LecturerDashboard />}
    </div>
  );
};

export default App;
