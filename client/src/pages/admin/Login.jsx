import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import jcc from '../../assets/jcc.svg'

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false); // For eye toggle
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", formData);
      if (res.data.success) {
        localStorage.setItem("adminToken", res.data.token);
        toast.success("Login Successful!");
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#001f3f] p-4"
         style={{ backgroundImage: 'linear-gradient(to top, #001f3f, #005c8a)' }}>
      
      {/* Container Card */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl w-full sm:max-w-md relative">
        
        {/* TOP RIGHT LOGO PLACEHOLDER */}
        <div className="absolute top-6 right-8 w-36 h-26 bg-gray-200 rounded-lg flex items-center justify-center border-gray-100 text-[10px] text-gray-400 text-center">
         <img src={jcc} alt="" />
        </div>

        {/* Header */}
        <div className="mb-10 pt-4">
          <h2 className="text-3xl font-bold text-gray-900">Login</h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">Please enter your credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email with Icon */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2 ml-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#49c5cf] focus:border-transparent outline-none transition-all"
                placeholder="email@example.com"
              />
              {/* Email Icon */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 border-r pr-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password with Icons */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#49c5cf] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              {/* Key Icon */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 border-r pr-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              {/* Eye Toggle Icon */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-[#49c5cf] transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.878 9.878" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#001f3f] text-white font-bold py-4 rounded-xl hover:bg-[#002a55] active:scale-[0.98] transition-all shadow-lg mt-4 disabled:bg-gray-400"
          >
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;