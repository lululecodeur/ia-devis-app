'use client';
import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Card({
  children,
  title,
  className = '',
  initialOpen = true,
}: {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  initialOpen?: boolean;
}) {
  const [ouvert, setOuvert] = useState(initialOpen);

  return (
    <div className={`w-full bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <button
        onClick={() => setOuvert(!ouvert)}
        className="w-full flex justify-between items-center px-4 py-3 sm:px-6 transition-colors hover:bg-gray-50 rounded-t-xl cursor-pointer group"
      >
        <span className="text-base sm:text-lg font-semibold text-gray-800">{title}</span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${
            ouvert ? 'rotate-0' : '-rotate-90'
          } text-gray-500 group-hover:text-gray-700`}
        />
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          ouvert ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 sm:px-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
