import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileText,
  MessageSquare,
  User,
  LogOut,
  X,
  Sparkles,
  Activity,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navSections = [
    {
      title: 'ANALYTICS ENGINE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, shortcut: '⌘D' },
        { name: 'Upload Dataset', path: '/upload', icon: Upload, shortcut: '⌘U' },
        { name: 'AI Reports', path: '/reports', icon: FileText, shortcut: '⌘R' },
        { name: 'RAG Assistant', path: '/chat', icon: MessageSquare, shortcut: '⌘C' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'User Profile', path: '/profile', icon: User },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Linear & Notion Inspired Light Theme) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Switcher */}
        <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate tracking-tight">MarketMindAI</p>
              <p className="text-[10px] font-mono text-emerald-600 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                FastAPI Connected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.shortcut && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 border border-gray-200">
                        {item.shortcut}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom System Status & User Logout Footer */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-[11px] text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" /> Pipeline Status
            </span>
            <span className="font-mono text-emerald-600 font-bold">Active</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
