import { NavLink } from 'react-router-dom';
import { Home, User, Bell } from 'lucide-react';

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-4 z-50 pb-safe">
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Home size={24} />
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>

      <NavLink 
        to="/profile-setup" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <User size={24} />
        <span className="text-[10px] font-medium">Profile</span>
      </NavLink>
    </div>
  );
}
