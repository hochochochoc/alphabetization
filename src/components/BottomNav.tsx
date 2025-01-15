import React from "react";
import { Calendar, User, ClipboardList, History } from "lucide-react";
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

  const menuItems: MenuItem[] = [
    { title: "Calendar", icon: Calendar, path: "/test" },
    { title: "Profile", icon: User, path: "/profile" },
    { title: "Plans", icon: ClipboardList, path: "/plans" },
    { title: "History", icon: History, path: "/history" },
  ];

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 ${className || ""}`}
    >
      <nav className="flex items-center rounded-full border border-white/40 bg-white/80 px-1 py-2 shadow-lg backdrop-blur-md">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => navigate(item.path)}
            className={`mx-1 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
              isActive(item.path)
                ? "scale-110 bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-md"
                : "text-blue-600/70 hover:scale-105 hover:bg-blue-50/80"
            }`}
          >
            <item.icon size={20} strokeWidth={2} />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
