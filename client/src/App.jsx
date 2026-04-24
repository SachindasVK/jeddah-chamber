import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Suspense } from "react";
import Loading from "./components/Loading/Loading";
import { useState } from "react";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./context/ProtectedRoutes";
import { Toaster } from "react-hot-toast";
import ViewDoc from "./pages/user/ViewDoc";
const Dashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const Login = React.lazy(() => import("./pages/admin/Login"));
const PdfList = React.lazy(() => import("./pages/admin/PdfList"));
const PdfDetails = React.lazy(() => import("./pages/admin/PdfDetails"));
const NotFound = React.lazy(() => import("./pages/user/NotFound"));

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Loading />;
  }
  return (
    <>
      <Toaster position="top-center" reverseOrder={true} />
      <Suspense fallback={<Loading />}>
        <header>
          <Navbar />
        </header>
        <Routes>
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/pdf-list" element={<PdfList />} />
          <Route path="/admin/document/:id" element={<PdfDetails />} />
          <Route path="/view/:id" element={<ViewDoc />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!location.pathname.startsWith("/view/") && (
          <footer>
            <Footer />
          </footer>
        )}
      </Suspense>
    </>
  );
};

export default App;
