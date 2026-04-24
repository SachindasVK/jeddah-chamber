import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";

// Essential styles for react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { MdViewSidebar } from "react-icons/md";
import Loading from "../../components/Loading/Loading";

import {
  FaChevronLeft,
  FaChevronRight,
  FaArrowRotateLeft,
  FaArrowRotateRight,
} from "react-icons/fa6";

import { IoMoonOutline } from "react-icons/io5";

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Sun,
  MoveHorizontal,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ViewDoc = () => {
  const { id } = useParams();
  
  // State
  const [doc, setDoc] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState(
    localStorage.getItem("docTheme") || "light"
  );

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";
  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  // Window Resize - Responsive base width
  useEffect(() => {
    const handleResize = () => {
      // Standardize base width for desktop vs mobile
      const width = window.innerWidth > 640 ? 600 : window.innerWidth - 32;
      setContainerWidth(width);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Theme Persistence
  useEffect(() => {
    localStorage.setItem("docTheme", theme);
  }, [theme]);

  // Fetch Document
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/document/view/${id}`
        );
        setDoc(res.data);
      } catch (err) {
        toast.error("Verification failed");
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [id]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(finalUrl, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "document.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Download failed");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f4f7f9]"}`}>
      
      {/* Toolbar */}
      <div className={`w-full sticky top-0 z-10 flex flex-col gap-2 p-3 shadow-md border ${theme === "dark" ? "bg-[#1e293b] border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="flex items-center w-full gap-1.5">
          <div className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border py-0.5 px-1 rounded-sm`}>
            <div className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} flex items-center py-1 px-2 rounded-sm`}>
              <MdViewSidebar size={18} color={iconColor} />
            </div>
          </div>

          {/* Pagination */}
          <div className={`flex items-center gap-1 ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}>
            <button 
              className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} px-2 flex items-center py-1 rounded-sm disabled:opacity-50`}
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
            >
              <FaChevronLeft size={17} color={iconColor} />
            </button>
            <div className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} px-5 rounded-sm`}>
              <span className={`px-2 text-sm font-bold ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>
                {pageNumber}/{numPages || 1}
              </span>
            </div>
            <button 
              className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} px-1 flex items-center py-1 rounded-sm disabled:opacity-50`}
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
            >
              <FaChevronRight size={17} color={iconColor} />
            </button>
          </div>

          {/* Download */}
          <div className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}>
            <button onClick={handleDownload} className={`flex border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} items-center px-2 py-1 rounded-sm`}>
              <Download size={17} color={iconColor} />
            </button>
          </div>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <div className={`flex gap-1 ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}>
            <button 
               onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.5))}
               className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-2 flex items-center rounded-sm`}
            >
              <ZoomOut size={17} color={iconColor} />
            </button>

            <button 
              onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-2 flex items-center rounded-sm`}
            >
              <ZoomIn size={17} color={iconColor} />
            </button>

            <button 
              onClick={() => { setZoom(1); setRotation(0); }}
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-2 flex items-center py-1 rounded-sm`}
            >
              <MoveHorizontal size={17} color={iconColor} />
            </button>
          </div>

          {/* Rotation */}
          <div className={`flex gap-1 px-1 p-0.5 items-center rounded-sm ${theme === "dark" ? "border border-gray-600" : "bg-gray-100 border border-gray-300"}`}>
            <button onClick={() => setRotation((prev) => prev - 90)} className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-2 flex py-1 rounded-sm`}>
              <RotateCcw size={17} color={iconColor} />
            </button>
            <button onClick={() => setRotation((prev) => prev + 90)} className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-2 flex items-center py-1 rounded-sm`}>
              <RotateCw size={17} color={iconColor} />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`p-0.5 rounded-sm ${theme === "dark" ? "border border-gray-600" : "bg-gray-100 border border-gray-300"}`}
          >
            <div className={`${theme === "dark" ? "bg-gray-700 border-gray-400" : "bg-gray-100 border-gray-300"} border p-1 rounded-sm`}>
              {theme === "light" ? <IoMoonOutline size={17} color="#4b5563" /> : <Sun size={17} color="white" />}
            </div>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className={`w-full mt-1 overflow-auto py-4 flex-grow ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}
        style={{ height: "calc(100vh - 140px)" }}
      >
        {loadingDetails ? (
           <Loading />
        ) : finalUrl ? (
          <div
            className={`w-max mx-auto transition-all duration-300 ease-in-out ${theme === "dark" ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : "shadow-lg"}`}
          >
            <Document
              file={finalUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              error={<div className="p-20 text-red-500">Failed to load PDF.</div>}
              loading={<div className="p-20"><Loading /></div>}
            >
              <Page
                pageNumber={pageNumber}
                width={containerWidth}
                rotate={rotation}
                devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2)}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                canvasBackground="white"
              />
            </Document>
          </div>
        ) : (
          <div className={`p-20 text-center text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            No PDF document available.
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDoc;