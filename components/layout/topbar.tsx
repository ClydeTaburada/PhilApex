import React from 'react';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { StaffNotifications } from '@/components/staff-notifications';

interface TopbarProps {
  pageTitle: string;
  userName: string;
  userRole: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'System Admin', color: 'bg-purple-100 text-purple-800' },
  processing_officer: { label: 'Processing Officer', color: 'bg-indigo-100 text-indigo-700' },
  front_desk: { label: 'Front Desk', color: 'bg-sky-100 text-sky-700' },
};

export function Topbar({ pageTitle, userName, userRole }: TopbarProps) {
  const roleInfo = ROLE_LABELS[userRole] || { 
    label: userRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), 
    color: 'bg-gray-100 text-gray-700' 
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20">
      <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{pageTitle}</h2>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeSwitcher />
        <div className="h-4 w-px bg-gray-200" />
        <StaffNotifications />
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-700 hidden sm:inline">{userName}</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleInfo.color}`}>
          {roleInfo.label}
        </span>
      </div>
    </header>
  );
}
