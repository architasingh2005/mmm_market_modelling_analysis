import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  UploadCloud,
  FileText,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Zap,
  Activity,
  Database,
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Sales Analyzed',
      value: '₹142.5M',
      change: '+14.2% vs last Q',
      isPositive: true,
      icon: TrendingUp,
      desc: 'Across 5 spend channels',
    },
    {
      title: 'Attribution ROI Lift',
      value: '3.84x',
      change: '+0.4x incremental',
      isPositive: true,
      icon: BarChart3,
      desc: 'Adstock optimized',
    },
    {
      title: 'AI Microservice Engine',
      value: 'FastAPI Active',
      change: '100% Uptime',
      isPositive: true,
      icon: Zap,
      desc: 'Python process connected',
    },
    {
      title: 'Data Quality Score',
      value: '99.8%',
      change: '0 Missing Rows',
      isPositive: true,
      icon: Activity,
      desc: 'Schema auto-validated',
    },
  ];

  const recentDatasets = [
    {
      id: 'ds-1097',
      name: 'synthetic_mmm_weekly_india.csv',
      records: '109,795 rows',
      status: 'Analyzed',
      date: 'Today',
    },
    {
      id: 'ds-1096',
      name: 'q2_customer_sentiment.csv',
      records: '45,210 rows',
      status: 'Completed',
      date: '2 days ago',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MarketMindAI Executive Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time Market Mix Modeling metrics and automated executive report management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Dataset
          </Link>
          <Link
            to="/chat"
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl border border-gray-300 shadow-sm transition flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" /> RAG Assistant
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid (Clerk & Power BI Inspired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{stat.title}</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                {stat.value}
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  {stat.change}
                </span>
                <span className="text-gray-500">{stat.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Datasets Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">Recent Datasets</h3>
            </div>
            <Link
              to="/upload"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentDatasets.map((ds) => (
              <div key={ds.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-900">{ds.name}</p>
                  <p className="text-[11px] font-mono text-gray-500">{ds.records}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    {ds.status}
                  </span>
                  <span className="text-gray-500 text-[11px] hidden sm:block">{ds.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Launchpad Banner */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-gray-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-4 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Automated MMM Pipeline</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Connect Express dataset uploads directly to Python FastAPI microservices for regression modeling and instant executive reports.
            </p>
          </div>

          <div className="space-y-2">
            <Link
              to="/reports"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
            >
              <FileText className="w-4 h-4" /> View AI Generated Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
