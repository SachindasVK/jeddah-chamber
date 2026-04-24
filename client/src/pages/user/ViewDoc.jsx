import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";

// Essential styles
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
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, Sun, MoveHorizontal } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ViewDoc = () => {
  const { id } = useParams();
  const containerRef = useRef(null);
  const pdfWrapperRef = useRef(null); // Ref for the actual PDF element
  
  // Gesture Tracking Refs
  const touchState = useRef({
    initialDistance: 0,
    initialZoom: 1,
    isPinching: false,
  });

  const [doc, setDoc] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("docTheme") || "light");

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";
  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  // --- Helpers ---
  const getDistance = (t1, t2) => Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);

  // --- Handlers ---
  const handleZoom = (type) => {
    setZoom(prev => {
      if (type === 'in') return Math.min(prev + 0.2, 3);
      if (type === 'out') return Math.max(prev - 0.2, 0.5);
      return 1;
    });
  };

  // --- Effects ---

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth > 640 ? 600 : window.innerWidth - 32;
      setContainerWidth(width);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Optimized Touch Gestures
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        touchState.current.isPinching = true;
        touchState.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
        touchState.current.initialZoom = zoom;
      }
    };

    const onTouchMove = (e) => {
      if (!touchState.current.isPinching || e.touches.length !== 2) return;
      
      e.preventDefault(); // Prevent native browser zoom
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchState.current.initialDistance;
      
      // Calculate new zoom level
      const newZoom = Math.min(Math.max(touchState.current.initialZoom * scale, 0.5), 3);
      
      // Use requestAnimationFrame for smooth CSS scaling if needed, 
      // but for "Normal" senior feel, we update state moderately.
      setZoom(newZoom);
    };

    const onTouchEnd = () => {
      touchState.current.isPinching = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoom]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/document/view/${id}`);
        setDoc(res.data);
      } catch (err) {
        toast.error("Failed to load document details");
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f4f7f9]"}`}>
      
      {/* Refactored Toolbar: Better spacing and accessibility */}
      <div className={`w-full sticky top-0 hide-scrollbar z-50 flex flex-col gap-2 p-3 shadow-lg border-b ${theme === "dark" ? "bg-[#1e293b]/90 border-gray-700 backdrop-blur-md" : "bg-white/90 border-gray-200 backdrop-blur-md"}`}>
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto gap-2">
          
          {/* Navigation Group */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
            <button 
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md disabled:opacity-30"
              onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
              disabled={pageNumber <= 1}
            >
              <FaChevronLeft size={16} color={iconColor} />
            </button>
            <span className={`text-sm font-mono font-bold min-w-[60px] text-center ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
              {pageNumber} / {numPages || '--'}
            </span>
            <button 
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md disabled:opacity-30"
              onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
              disabled={pageNumber >= numPages}
            >
              <FaChevronRight size={16} color={iconColor} />
            </button>
          </div>

          {/* Action Group */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
              <button onClick={() => handleZoom('out')} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md">
                <ZoomOut size={18} color={iconColor} />
              </button>
              <span className="text-xs font-bold w-12 text-center dark:text-white">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={() => handleZoom('in')} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md">
                <ZoomIn size={18} color={iconColor} />
              </button>
            </div>

            <button 
              onClick={() => {setTheme(t => t === 'light' ? 'dark' : 'light'); localStorage.setItem("docTheme", theme === 'light' ? 'dark' : 'light')}}
              className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all"
            >
              {theme === "light" ? <IoMoonOutline size={18} /> : <Sun size={18} color="white" />}
            </button>

            <button onClick={() => window.print()} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewport */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto flex justify-center items-start p-4 scroll-smooth ${theme === "dark" ? "bg-[#0f172a]" : "bg-gray-200"}`}
        style={{ touchAction: "none" }}
      >
        {loadingDetails ? (
           <div className="h-full flex items-center"><Loading /></div>
        ) : finalUrl ? (
          <div
            ref={pdfWrapperRef}
            className={`origin-top transition-transform duration-200 ease-out h-fit ${theme === "dark" ? "shadow-2xl" : "shadow-xl"}`}
          >
            <Document
              file={finalUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              error={<div className="p-10 dark:text-white">Error loading PDF.</div>}
              loading={<Loading />}
            >
              <Page
                pageNumber={pageNumber}
                width={containerWidth}
                scale={zoom}
                rotate={rotation}
                // Important for quality
                devicePixelRatio={Math.min(2, window.devicePixelRatio)} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="rounded-sm overflow-hidden"
              />
            </Document>
          </div>
        ) : (
          <div className="mt-20 dark:text-white">Document not found.</div>
        )}
      </div>
    </div>
  );
};

export default ViewDoc;