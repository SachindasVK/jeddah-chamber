import React from "react";
import { Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import Loading from "./components/Loading/Loading";
import { useState } from "react";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./context/ProtectedRoutes";
import { Toaster } from "react-hot-toast";
import PdfList from "./pages/admin/PdfList";
import PdfDetails from "./pages/admin/PdfDetails";
import NotFound from "./pages/user/NotFound";

const Dashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const ViewDoc = React.lazy(() => import("./pages/user/ViewDoc"));
const Login = React.lazy(() => import("./pages/admin/Login"));

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
        <footer>
          <Footer />
        </footer>
      </Suspense>
    </>
  );
};

export default App;
