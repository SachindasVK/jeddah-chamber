import React from "react";
import { Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import Loading from "./components/ui/Loading/Loading";
import { useState } from "react";
import { useEffect } from "react";
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";

const Signup = React.lazy(() => import("./pages/admin/Signup"));
const VerifyOtp = React.lazy(()=> import("./pages/admin/VerifyOtp"))
const Dashboard = React.lazy(()=> import("./pages/admin/Dashboard"))
const ViewDoc = React.lazy(()=> import("./pages/user/ViewDoc"))
const Login = React.lazy(()=>import("./pages/admin/Login"))

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Loading />;
  }
  return (
    <Suspense fallback={<Loading />}>
      <header>
        <Navbar />
      </header>
      <Routes>
        <Route path="/admin/signup" element={<Signup />} />
        <Route path="/admin/verify-otp" element={<VerifyOtp />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/view/:id" element={<ViewDoc />} />
      </Routes>
      <footer>
        <Footer />
      </footer>
    </Suspense>
  );
};

export default App;
