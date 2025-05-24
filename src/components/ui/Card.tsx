import { ReactNode } from 'react';

export default function Card({
  children,
  title,
  className = '',
}: {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 ${className}`}
    >
      {title && <h2 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h2>}
      {children}
    </div>
  );
}
