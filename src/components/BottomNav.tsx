import React, { useState } from "react";
import { Calendar, User, ClipboardList, Ellipsis, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

interface BottomNavProps {
  className?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTabOpen, setIsTabOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { title: "Calendar", icon: Calendar, path: "/menu" },
    { title: "Profile", icon: User, path: "/profile" },
    { title: "Plans", icon: ClipboardList, path: "/history" },
  ];

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <>
      {/* Sliding Tab */}
      <div
        className={`fixed right-0 bottom-16 z-40 -translate-y-1/2 transform transition-transform duration-300 ease-in-out ${
          isTabOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 rounded-l-xl bg-blue-100 px-6 py-4 shadow-lg">
          <Bell className="h-6 w-6 text-blue-500" />
          <span className="text-lg font-medium text-blue-500">Novedades</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 ${className || ""}`}
      >
        <nav className="flex items-center rounded-full border border-white/40 bg-white/80 px-1 py-2 shadow-lg backdrop-blur-md">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`mx-1 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                isActive(item.path)
                  ? "scale-110 bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-md"
                  : "text-blue-600/70 hover:scale-100 hover:bg-blue-50/80"
              }`}
            >
              <item.icon size={24} strokeWidth={2} />
            </button>
          ))}
          <button
            onClick={() => setIsTabOpen(!isTabOpen)}
            className={`mx-1 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
              isTabOpen
                ? "scale-110 bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-md"
                : "text-blue-600/70 hover:scale-100 hover:bg-blue-50/80"
            }`}
          >
            <Ellipsis size={24} strokeWidth={2} />
          </button>
        </nav>
      </div>
    </>
  );
};

export default BottomNav;
