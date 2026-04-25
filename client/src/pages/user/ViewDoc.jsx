import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";

// Essential styles for react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { MdViewSidebar } from "react-icons/md";
import Loading from '../../components/Loading/Loading'

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
  const containerRef = useRef(null);
  const lastDistance = useRef(null);

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
    return Math.hypot(
      t2.pageX - t1.pageX,
      t2.pageY - t1.pageY
    );
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
        delta > 0
          ? Math.min(prev + 0.1, 3)
          : Math.max(prev - 0.1, 0.5)
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
      <div
  className={`w-full sticky top-0 z-10 flex flex-col gap-1 p-2 shadow-sm border ${
    theme === "dark"
      ? "bg-[#1e293b] border-gray-700"
      : "bg-white border-gray-100"
  }`}
>
  <div className="flex items-center w-full gap-1">
    
    {/* Sidebar */}
    <div className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-[2px] rounded`}>
      <div className="border px-1 py-[2px] rounded">
        <MdViewSidebar size={14} color={iconColor} />
      </div>
    </div>

    {/* Pagination */}
    <div className={`flex items-center gap-1 border p-[2px] rounded ${
      theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"
    }`}>
      
      <button
        onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
        disabled={pageNumber <= 1}
        className="px-1 py-[2px]"
      >
        <FaChevronLeft size={14} color={pageNumber <= 1 ? "#64748b" : iconColor} />
      </button>

      <span className="text-xs font-semibold px-1">
        {pageNumber}/{numPages || 1}
      </span>

      <button
        onClick={() =>
          setPageNumber((prev) => Math.min(prev + 1, numPages))
        }
        disabled={pageNumber >= numPages}
        className="px-1 py-[2px]"
      >
        <FaChevronRight size={14} color={pageNumber >= numPages ? "#64748b" : iconColor} />
      </button>
    </div>

    {/* Download */}
    <div className="border p-[2px] rounded">
      <button onClick={handleDownload} className="px-1 py-[2px]">
        <Download size={14} color={iconColor} />
      </button>
    </div>
  </div>

  {/* Controls */}
  <div className="flex items-center gap-1">
    
    {/* Zoom */}
    <div className="flex gap-1 border p-[2px] rounded">
      <button onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.3))}>
        <ZoomOut size={14} color={iconColor} />
      </button>

      <button onClick={() => setZoom((prev) => prev + 0.2)}>
        <ZoomIn size={14} color={iconColor} />
      </button>

      <button
        onClick={() => {
          setZoom(1);
          setRotation(0);
        }}
      >
        <MoveHorizontal size={14} color={iconColor} />
      </button>
    </div>

    {/* Rotation */}
    <div className="flex gap-1 border p-[2px] rounded">
      <button onClick={() => setRotation((prev) => prev - 180)}>
        <FaArrowRotateLeft size={14} color={iconColor} />
      </button>

      <button onClick={() => setRotation((prev) => prev - 90)}>
        <RotateCcw size={14} color={iconColor} />
      </button>

      <button onClick={() => setRotation((prev) => prev + 90)}>
        <RotateCw size={14} color={iconColor} />
      </button>

      <button onClick={() => setRotation((prev) => prev + 180)}>
        <FaArrowRotateRight size={14} color={iconColor} />
      </button>
    </div>

    {/* Theme */}
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="border p-[3px] rounded"
    >
      {theme === "light" ? (
        <IoMoonOutline size={14} />
      ) : (
        <Sun size={14} />
      )}
    </button>
  </div>
</div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className={`w-full mt-1 overflow-auto py-4 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}
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
              error={<div className="p-20 text-red-500">Failed to load PDF.</div>}
              loading={<></>}
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
          <div className={`p-20 text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            No PDF document available.
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDoc;
