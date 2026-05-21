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
  FaArrowsLeftRightToLine
} from "react-icons/fa6";

import { IoMoonOutline } from "react-icons/io5";

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Sun,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ViewDoc = () => {
  const { id } = useParams();
  const containerRef = useRef(null);
  const lastDistance = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [doc, setDoc] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState(
    localStorage.getItem("docTheme") || "light",
  );

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";
  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth > 640 ? 600 : window.innerWidth - 32;
      setContainerWidth(width);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getDistance = (t1, t2) => {
      return Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2) return;

      const distance = getDistance(e.touches[0], e.touches[1]);

      if (!lastDistance.current) {
        lastDistance.current = distance;
        return;
      }

      const delta = distance - lastDistance.current;

      if (Math.abs(delta) > 10) {
        setZoom((prev) =>
          delta > 0 ? Math.min(prev + 0.1, 3) : Math.max(prev - 0.1, 0.5),
        );
        lastDistance.current = distance;
      }
    };

    const onTouchEnd = () => {
      lastDistance.current = null;
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("docTheme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/document/view/${id}`,
        );
        setDoc(res.data);
      } catch (err) {
        console.error("Verification failed:", err);
        toast.error("Verification failed");
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [id]);

  // THIS WAS THE MISSING FUNCTION
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(finalUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "document.pdf"); // file name
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Download failed");
      console.error(error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f4f7f9]"}`}
    >
     {/* Header Toolbar */}
<div
  className={`w-full sticky top-0 z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 p-3 shadow-md border ${
    theme === "dark"
      ? "bg-[#1e293b] border-gray-700"
      : "bg-white border-gray-100"
  }`}
>
  {/* LEFT SECTION */}
  <div className="flex items-center gap-2 flex-wrap">
    {/* Sidebar Toggle */}
    <div
      className={`${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      } border p-1 rounded-sm`}
    >
      <button
        onClick={() => setShowSidebar((prev) => !prev)}
        className={`flex items-center rounded-sm ${
          showSidebar ? "bg-blue-700" : ""
        }`}
      >
        <MdViewSidebar
          size={16}
          color={showSidebar ? "#fff" : iconColor}
        />
      </button>
    </div>

    {/* Page Navigation */}
    <div
      className={`flex items-center gap-1 ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      } border p-1 rounded-sm`}
    >
      <button
        onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
        disabled={pageNumber <= 1}
        className="border px-2 py-1 rounded-sm"
      >
        <FaChevronLeft
          size={14}
          color={pageNumber <= 1 ? "#64748b" : iconColor}
        />
      </button>

      <div
        className={`px-4 text-sm font-bold ${
          theme === "dark" ? "text-gray-200" : "text-gray-700"
        }`}
      >
        {pageNumber}/{numPages || 1}
      </div>

      <button
        onClick={() =>
          setPageNumber((prev) => Math.min(prev + 1, numPages))
        }
        disabled={pageNumber >= numPages}
        className="border px-2 py-1 rounded-sm"
      >
        <FaChevronRight
          size={14}
          color={pageNumber >= numPages ? "#64748b" : iconColor}
        />
      </button>
    </div>
  </div>

  {/* CENTER SECTION */}
  <div className="flex items-center gap-2 flex-wrap justify-center">
    {/* Zoom Controls */}
    <div
      className={`flex items-center gap-1 ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      } border p-1 rounded-sm`}
    >
      <button
        onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.3))}
        className="border px-2 py-1 rounded-sm"
      >
        <ZoomOut size={14} color={iconColor} />
      </button>

      <button
        onClick={() => setZoom((prev) => prev + 0.2)}
        className="border px-2 py-1 rounded-sm"
      >
        <ZoomIn size={14} color={iconColor} />
      </button>

      <button
        onClick={() => {
          setZoom(1);
          setRotation(0);
        }}
        className="border px-2 py-1 rounded-sm"
      >
        <FaArrowsLeftRightToLine size={14} color={iconColor} />
      </button>
    </div>

    {/* Rotation */}
    <div
      className={`flex items-center gap-1 ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      } border p-1 rounded-sm`}
    >
      <button
        onClick={() => setRotation((prev) => prev - 90)}
        className="border px-2 py-1 rounded-sm"
      >
        <RotateCcw size={14} color={iconColor} />
      </button>

      <button
        onClick={() => setRotation((prev) => prev + 90)}
        className="border px-2 py-1 rounded-sm"
      >
        <RotateCw size={14} color={iconColor} />
      </button>

      <button
        onClick={() => setRotation((prev) => prev + 180)}
        className="border px-2 py-1 rounded-sm"
      >
        <FaArrowRotateRight size={14} color={iconColor} />
      </button>
    </div>
  </div>

  {/* RIGHT SECTION */}
  <div className="flex items-center gap-2 justify-end">
    {/* Download */}
    <button
      onClick={handleDownload}
      className={`border p-2 rounded-sm ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      }`}
    >
      <Download size={14} color={iconColor} />
    </button>

    {/* Theme */}
    <button
      onClick={() =>
        setTheme(theme === "light" ? "dark" : "light")
      }
      className={`border p-2 rounded-sm ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      }`}
    >
      {theme === "light" ? (
        <IoMoonOutline size={14} color={iconColor} />
      ) : (
        <Sun size={14} color="#fff" />
      )}
    </button>
  </div>
</div>

      {/* Bottom Thumbnail Sidebar (FULL HIDE FIX) */}
      <div
        className={`fixed bottom-0 left-0 w-full z-20 ${
          showSidebar
            ? "translate-y-0 opacity-100 visible"
            : "translate-y-full opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setShowSidebar(false)}
        />

        {/* Bottom Bar */}
        <div className="relative bg-blue-700 h-[147px] flex items-center overflow-x-auto gap-2 shadow-2xl">
          {finalUrl && (
            <Document
  file={finalUrl}
  onLoadSuccess={onDocumentLoadSuccess}
  error={
    <div className="p-20 text-red-500">Failed to load PDF.</div>
  }
>
              {Array.from(new Array(numPages || 0), (_, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setPageNumber(index + 1);
                    setShowSidebar(false);
                  }}
                  className={`cursor-pointer border-2 ${
                    pageNumber === index + 1
                      ? "border-blue-400"
                      : "border-transparent"
                  }`}
                >
                  <Page
                    pageNumber={index + 1}
                    width={100}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Verification Info Side Panel */}
        <div className={`w-full lg:w-[420px] p-5 lg:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r ${
          theme === "dark" 
            ? "bg-[#1e293b] border-gray-700 text-white" 
            : "bg-white border-gray-200 text-gray-800"
        } flex flex-col gap-5`} dir="rtl">
         

          
          </div>

          {/* Secure verification note */}
          <div className={`mt-auto p-4 rounded-xl border text-center flex items-center justify-center gap-3 ${
            theme === "dark" ? "bg-slate-850/50 border-slate-800 text-slate-400" : "bg-blue-50/30 border-blue-50 text-blue-800/75"
          }`}>
            
          </div>
        </div>

        {/* PDF Container */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-auto py-4 relative ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}
          style={{ height: "calc(100vh - 140px)", touchAction: "pan-x pan-y" }}
        >
          {loadingDetails ? (
            <Loading />
          ) : finalUrl ? (
            <div
              className={`w-max mx-auto transition-all duration-300 h-fit ${theme === "dark" ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : "shadow-lg"}`}
            >
              <Document
                file={finalUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                error={
                  <div className="p-20 text-red-500">
                    Failed to load PDF.
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth * zoom}
                  rotate={rotation}
                  devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2)}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  canvasBackground="white"
                  className="pdf-page-high-quality"
                />
              </Document>
            </div>
          ) : (
            <div
              className={`p-20 text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              No PDF document available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDoc;
