import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ onOpenJobHunter }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Job',
      subLabel: 'Hunter',
      icon: 'fas fa-search',
      gradient: 'from-emerald-500/75 to-teal-600/75',
      onClick: onOpenJobHunter
    },
    {
      label: 'Job',
      subLabel: 'Learning',
      icon: 'fas fa-book-open',
      gradient: 'from-blue-500/75 to-cyan-600/75',
      onClick: () => navigate('/admin/skills/study-plan-maker')
    },
    {
      label: 'Design',
      subLabel: 'Courses',
      icon: 'fas fa-graduation-cap',
      gradient: 'from-orange-500/75 to-pink-600/75',
      onClick: () => navigate('/admin/skills/topics')
    },
    {
      label: 'Design',
      subLabel: 'Tests',
      icon: 'fas fa-clipboard-check',
      gradient: 'from-purple-500/75 to-indigo-600/75',
      onClick: () => navigate('/admin/tests/manage')
    },
    {
      label: 'Course',
      subLabel: 'Content',
      icon: 'fas fa-video',
      gradient: 'from-violet-500/75 to-purple-600/75',
      onClick: () => navigate('/admin/skills/classroom-recordings')
    },
    {
      label: 'Job',
      subLabel: 'content',
      icon: 'fas fa-briefcase',
      gradient: 'from-rose-500/75 to-pink-600/75',
      onClick: () => navigate('/admin/jobs')
    },
    {
      label: 'Your',
      subLabel: 'classrooms',
      icon: 'fas fa-chalkboard',
      gradient: 'from-slate-600/75 to-slate-700/75',
      onClick: () => navigate('/admin/classrooms/view')
    },
    {
      label: 'Define',
      subLabel: 'Access',
      icon: 'fas fa-shield-alt',
      gradient: 'from-teal-600/75 to-cyan-700/75',
      onClick: () => navigate('/admin/access/manage')
    }
  ];

  return (
    <section>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-5">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="flex flex-col items-center justify-start gap-2 touch-manipulation active:scale-95 transition-transform w-full"
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${action.gradient} backdrop-blur-md ring-1 ring-white/40 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center`} style={{ backdropFilter: 'blur(12px) saturate(180%)' }}>
              <i className={`${action.icon} text-white text-lg md:text-xl drop-shadow-sm`}></i>
            </div>
            <span className="text-[11px] md:text-xs font-medium text-slate-700 text-center leading-snug block mx-auto">
              <span className="text-[11px] md:text-xs">{action.label} </span>
              <span className="text-[9px] md:text-[10px]">{action.subLabel}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;

