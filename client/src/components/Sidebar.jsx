import React from 'react'
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, LineChart, FileText, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate(); 

  const handleLogout = () => {
    localStorage.removeItem("adminToken");

    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  return (
    <>
      <div className="w-full lg:w-64 bg-gray-900 text-white p-4 lg:p-6 shadow-xl lg:min-h-screen">
        <h2 className="flex items-center gap-2 text-2xl font-bold mb-6 lg:mb-10 text-blue-400 text-center lg:text-left">
         <QrCode /> QR Manager 
        </h2>

        <nav className="space-y-3 lg:space-y-4">
          <Link
            to="/admin/dashboard"
            className="block flex gap-2 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <LineChart />Dashboard
          </Link>

          <Link
            to="/admin/pdf-list"
            className="block flex gap-2 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <FileText /> PDF List
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex gap-2 text-left p-3 hover:bg-red-900/50 text-red-400 rounded-lg mt-6 lg:mt-10 transition-colors font-semibold border border-transparent hover:border-red-800"
          >
          <LogOut />  Logout
          </button>
        </nav>
      </div>
    </>
  )
}

export default Sidebar