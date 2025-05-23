import { ReactNode } from "react";

export default function Card({
  children,
  title,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`w-full bg-white p-8 rounded-xl shadow-md space-y-4 border border-gray-200 ${className}`}>
      {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}

      {children}
    </div>
  );
}
