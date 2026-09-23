export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue:   'from-blue-500 to-blue-600 shadow-blue-500/20',
    red:    'from-red-500 to-red-600 shadow-red-500/20',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/20',
    green:  'from-green-500 to-green-600 shadow-green-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/20',
  };

  return (
    <div className="card p-6 flex items-start gap-4 hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
        {subtitle && (
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
