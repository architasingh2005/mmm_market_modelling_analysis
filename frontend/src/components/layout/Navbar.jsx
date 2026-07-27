import { Menu, Search, Bell, Sparkles } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 bg-white/90 border-b border-gray-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 md:hidden focus:outline-none"
        aria-label="Toggle Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search / Command Bar Placeholder */}
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 w-64 md:w-80 text-xs text-gray-500 focus-within:border-indigo-500 focus-within:bg-white transition shadow-xs">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search datasets, reports, or AI..."
          className="bg-transparent border-none outline-none w-full text-gray-800 placeholder-gray-400 text-xs"
          readOnly
        />
        <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded text-gray-400 border border-gray-200 shadow-xs">
          ⌘K
        </span>
      </div>

      {/* User Info & Actions Header */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-900">Executive User</p>
            <p className="text-[10px] font-mono text-indigo-600 font-semibold">Enterprise Workspace</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-600 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-xs font-bold text-indigo-600">
              EU
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
