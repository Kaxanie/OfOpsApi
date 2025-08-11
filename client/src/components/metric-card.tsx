import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  iconColor: 'primary' | 'success' | 'secondary' | 'warning';
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon, 
  iconColor 
}: MetricCardProps) {
  const iconColorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    secondary: 'bg-pink-100 text-pink-600',
    warning: 'bg-yellow-100 text-yellow-600',
  };

  const changeColorClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColorClasses[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClasses[iconColor]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
