import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";

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

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15; // Slightly larger step for better feel

const ViewDoc = () => {
  const { id } = useParams();
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const startZoomRef = useRef(1);

  const [doc, setDoc] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(
    window.innerWidth > 640 ? 600 : window.innerWidth - 32
  );
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState(
    localStorage.getItem("docTheme") || "light"
  );

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";
  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  // Responsive base width
  useEffect(() => {
    const handleResize = () => {
      setBaseWidth(window.innerWidth > 640 ? 600 : window.innerWidth - 32);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Smooth Touch Zoom (Two-finger vertical drag)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isPinching = false;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        startYRef.current = (e.touches[0].pageY + e.touches[1].pageY) / 2;
        startZoomRef.current = zoom;
        e.preventDefault();
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || !isPinching) return;

      e.preventDefault();

      const currentY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
      const deltaY = startYRef.current - currentY; // Positive = zoom out

      // Convert vertical movement to zoom (more natural feel)
      const zoomFactor = 1 - deltaY * 0.008; // Adjust sensitivity (0.008 works well)

      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, startZoomRef.current * zoomFactor)
      );

      if (Math.abs(newZoom - zoom) > 0.02) {
        setZoom(newZoom);
      }
    };

    const onTouchEnd = () => {
      isPinching = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoom]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("docTheme", theme);
  }, [theme]);

  // Fetch document
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/document/view/${id}`
        );
        setDoc(res.data);
      } catch {
        toast.error("Verification failed");
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

  // Zoom helpers
  const zoomIn = () =>
    setZoom((prev) => Math.min(+(prev + ZOOM_STEP).toFixed(2), MAX_ZOOM));

  const zoomOut = () =>
    setZoom((prev) => Math.max(+(prev - ZOOM_STEP).toFixed(2), MIN_ZOOM));

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  // Download
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
    } catch {
      toast.error("Download failed");
    }
  };

  const panelCls = `${
    theme === "dark"
      ? "bg-gray-800 border-gray-600"
      : "bg-gray-100 border-gray-300"
  } border`;

  const btnWrap = (extra = "") =>
    `${panelCls} flex items-center px-2 py-1 rounded-sm ${extra}`;

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark" ? "bg-[#0f172a]" : "bg-[#f4f7f9]"
      }`}
    >
      {/* Header Toolbar */}
      <div
        className={`w-full sticky top-0 z-10 flex flex-col gap-2 p-3 shadow-md border ${
          theme === "dark"
            ? "bg-[#1e293b] border-gray-700"
            : "bg-white border-gray-100"
        }`}
      >
        {/* Row 1 - Navigation & Download */}
        <div className="flex items-center w-full gap-1.5">
          <div className={`${panelCls} py-0.5 px-1 rounded-sm`}>
            <div className={btnWrap()}>
              <MdViewSidebar size={18} color={iconColor} />
            </div>
          </div>

          {/* Page Navigation */}
          <div className={`flex items-center gap-1 ${panelCls} p-0.5 rounded-sm`}>
            <div className={btnWrap()}>
              <button
                onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                disabled={pageNumber <= 1}
              >
                <FaChevronLeft
                  size={17}
                  color={pageNumber <= 1 ? "#64748b" : iconColor}
                />
              </button>
            </div>

            <div className={`${panelCls} px-5 rounded-sm`}>
              <span
                className={`px-2 sm:px-4 text-sm sm:text-base font-bold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                }`}
              >
                {pageNumber} / {numPages || 1}
              </span>
            </div>

            <div className={btnWrap()}>
              <button
                onClick={() =>
                  setPageNumber((p) => Math.min(p + 1, numPages))
                }
                disabled={pageNumber >= numPages}
              >
                <FaChevronRight
                  size={17}
                  color={pageNumber >= numPages ? "#64748b" : iconColor}
                />
              </button>
            </div>
          </div>

          {/* Download Button */}
          <div className={`${panelCls} p-0.5 rounded-sm`}>
            <div className={btnWrap()}>
              <button onClick={handleDownload}>
                <Download size={17} color={iconColor} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 - Zoom, Rotation, Theme */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
          {/* Zoom Controls */}
          <div className={`flex gap-1 ${panelCls} p-0.5 rounded-sm`}>
            <div className={btnWrap()}>
              <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM}>
                <ZoomOut
                  size={17}
                  color={zoom <= MIN_ZOOM ? "#64748b" : iconColor}
                />
              </button>
            </div>

            <div className={`${panelCls} px-3 py-1 rounded-sm`}>
              <span
                className={`text-sm font-semibold select-none ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                }`}
              >
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className={btnWrap()}>
              <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM}>
                <ZoomIn
                  size={17}
                  color={zoom >= MAX_ZOOM ? "#64748b" : iconColor}
                />
              </button>
            </div>

            <div className={`${panelCls} px-2 py-1 rounded-sm`}>
              <button onClick={resetView}>
                <MoveHorizontal size={17} color={iconColor} />
              </button>
            </div>
          </div>

          {/* Rotation Controls */}
          <div
            className={`flex gap-1 px-1 p-0.5 items-center rounded-sm ${
              theme === "dark"
                ? "border border-gray-600"
                : "bg-gray-100 border border-gray-300"
            }`}
          >
            <div className={`${panelCls} py-1 px-1 rounded-sm flex items-center`}>
              <button onClick={() => setRotation((r) => r - 180)}>
                <FaArrowRotateLeft
                  size={17}
                  color={iconColor}
                  className="border p-1 rounded-full"
                />
              </button>
            </div>

            <div className={`${panelCls} px-2 flex py-1 rounded-sm`}>
              <button onClick={() => setRotation((r) => r - 90)}>
                <RotateCcw size={17} color={iconColor} />
              </button>
            </div>

            <div className={`${panelCls} px-2 flex items-center py-1 rounded-sm`}>
              <button onClick={() => setRotation((r) => r + 90)}>
                <RotateCw size={17} color={iconColor} />
              </button>
            </div>

            <div className={`${panelCls} px-1 flex items-center py-1 rounded-sm`}>
              <button onClick={() => setRotation((r) => r + 180)}>
                <FaArrowRotateRight
                  size={17}
                  color={iconColor}
                  className="border p-1 rounded-full"
                />
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="cursor-pointer"
          >
            <div
              className={`p-0.5 rounded-sm ${
                theme === "dark"
                  ? "border border-gray-600"
                  : "bg-gray-100 border border-gray-300"
              }`}
            >
              <div
                className={`border p-1 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-400"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                {theme === "light" ? (
                  <IoMoonOutline size={17} color="#4b5563" />
                ) : (
                  <Sun size={17} color="white" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div
        ref={containerRef}
        className={`w-full mt-1 overflow-auto py-8 ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
        style={{
          height: "calc(100vh - 140px)",
          touchAction: "pan-x pan-y pinch-zoom", // Allow native pinch as fallback
        }}
      >
        {loadingDetails ? (
          <Loading />
        ) : finalUrl ? (
          <div
            className={`w-max mx-auto transition-all duration-200 ${
              theme === "dark"
                ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                : "shadow-lg"
            }`}
          >
            <Document
              file={finalUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              error={<div className="p-20 text-red-500">Failed to load PDF.</div>}
              loading={<></>}
            >
              <Page
                pageNumber={pageNumber}
                width={baseWidth * zoom}
                rotate={rotation}
                devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2)}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                canvasBackground="white"
              />
            </Document>
          </div>
        ) : (
          <div
            className={`p-20 text-lg ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No PDF document available.
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDoc;