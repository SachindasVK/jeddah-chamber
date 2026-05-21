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
  FaArrowsLeftRightToLine,
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
  const [rotation, setRotation] = useState(0);

  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const [theme, setTheme] = useState(
    localStorage.getItem("docTheme") || "light"
  );

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";

  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  useEffect(() => {
    const handleResize = () => {
      let width;

      if (window.innerWidth >= 1280) {
        width = 900;
      } else if (window.innerWidth >= 1024) {
        width = 750;
      } else if (window.innerWidth >= 640) {
        width = 600;
      } else {
        width = window.innerWidth - 32;
      }

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
          `${import.meta.env.VITE_API_URL}/api/document/view/${id}`
        );

        setDoc(res.data);
      } catch (err) {
        console.error(err);
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
      const response = await axios.get(finalUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

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
      console.error(error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark" ? "bg-[#0f172a]" : "bg-[#f4f7f9]"
      }`}
    >
      {/* HEADER */}
      <div
        className={`w-full sticky top-0 z-20 p-3 shadow-md border ${
          theme === "dark"
            ? "bg-[#1e293b] border-gray-700"
            : "bg-white border-gray-100"
        }`}
      >
        {/* MOBILE */}
        <div className="flex flex-col gap-2 lg:hidden">
          {/* TOP */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Sidebar */}
            <button
              onClick={() => setShowSidebar((prev) => !prev)}
              className={`border p-1 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <MdViewSidebar
                size={15}
                color={showSidebar ? "#3b82f6" : iconColor}
              />
            </button>

            {/* Page Controls */}
            <div
              className={`flex items-center gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <button
                onClick={() =>
                  setPageNumber((prev) => Math.max(prev - 1, 1))
                }
                disabled={pageNumber <= 1}
                className="border px-1 py-0.5 rounded-sm"
              >
                <FaChevronLeft
                  size={15}
                  color={pageNumber <= 1 ? "#64748b" : iconColor}
                />
              </button>

              <div className="border px-4 py-0.5 rounded-sm text-sm font-bold">
                {pageNumber}/{numPages || 1}
              </div>

              <button
                onClick={() =>
                  setPageNumber((prev) =>
                    Math.min(prev + 1, numPages)
                  )
                }
                disabled={pageNumber >= numPages}
                className="border px-1 py-0.5 rounded-sm"
              >
                <FaChevronRight
                  size={15}
                  color={pageNumber >= numPages ? "#64748b" : iconColor}
                />
              </button>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className={`border p-1 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <Download size={15} color={iconColor} />
            </button>
          </div>

          {/* BOTTOM */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Zoom */}
            <div
              className={`flex gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <button
                onClick={() =>
                  setZoom((prev) => Math.max(prev - 0.2, 0.3))
                }
                className="border px-1 py-0.5 rounded-sm"
              >
                <ZoomOut size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setZoom((prev) => prev + 0.2)}
                className="border px-1 py-0.5 rounded-sm"
              >
                <ZoomIn size={15} color={iconColor} />
              </button>

              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
                className="border px-1 py-0.5 rounded-sm"
              >
                <FaArrowsLeftRightToLine
                  size={15}
                  color={iconColor}
                />
              </button>
            </div>

            {/* Rotation */}
            <div
              className={`flex gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <button
                onClick={() => setRotation((prev) => prev - 180)}
                className="border px-1 py-0.5 rounded-sm"
              >
                <FaArrowRotateLeft size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setRotation((prev) => prev - 90)}
                className="border px-1 py-0.5 rounded-sm"
              >
                <RotateCcw size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setRotation((prev) => prev + 90)}
                className="border px-1 py-0.5 rounded-sm"
              >
                <RotateCw size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setRotation((prev) => prev + 180)}
                className="border px-1 py-0.5 rounded-sm"
              >
                <FaArrowRotateRight size={15} color={iconColor} />
              </button>
            </div>

            {/* Theme */}
            <button
              onClick={() =>
                setTheme(theme === "light" ? "dark" : "light")
              }
              className={`border p-1 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              {theme === "light" ? (
                <IoMoonOutline size={15} color="#4b5563" />
              ) : (
                <Sun size={15} color="white" />
              )}
            </button>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar((prev) => !prev)}
              className={`border p-1 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <MdViewSidebar
                size={16}
                color={showSidebar ? "#3b82f6" : iconColor}
              />
            </button>

            <div
              className={`flex items-center gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <button
                onClick={() =>
                  setPageNumber((prev) => Math.max(prev - 1, 1))
                }
                disabled={pageNumber <= 1}
                className="border px-2 py-1 rounded-sm"
              >
                <FaChevronLeft
                  size={15}
                  color={pageNumber <= 1 ? "#64748b" : iconColor}
                />
              </button>

              <div className="border px-5 py-1 rounded-sm text-sm font-bold">
                {pageNumber}/{numPages || 1}
              </div>

              <button
                onClick={() =>
                  setPageNumber((prev) =>
                    Math.min(prev + 1, numPages)
                  )
                }
                disabled={pageNumber >= numPages}
                className="border px-2 py-1 rounded-sm"
              >
                <FaChevronRight
                  size={15}
                  color={pageNumber >= numPages ? "#64748b" : iconColor}
                />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className={`border p-2 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <Download size={16} color={iconColor} />
            </button>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            {/* Zoom */}
            <div
              className={`flex gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <button
                onClick={() =>
                  setZoom((prev) => Math.max(prev - 0.2, 0.3))
                }
                className="border px-2 py-1 rounded-sm"
              >
                <ZoomOut size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setZoom((prev) => prev + 0.2)}
                className="border px-2 py-1 rounded-sm"
              >
                <ZoomIn size={15} color={iconColor} />
              </button>

              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
                className="border px-2 py-1 rounded-sm"
              >
                <FaArrowsLeftRightToLine
                  size={15}
                  color={iconColor}
                />
              </button>
            </div>

            {/* Rotation */}
            <div
              className={`flex gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <button
                onClick={() => setRotation((prev) => prev - 180)}
                className="border px-2 py-1 rounded-sm"
              >
                <FaArrowRotateLeft size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setRotation((prev) => prev - 90)}
                className="border px-2 py-1 rounded-sm"
              >
                <RotateCcw size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setRotation((prev) => prev + 90)}
                className="border px-2 py-1 rounded-sm"
              >
                <RotateCw size={15} color={iconColor} />
              </button>

              <button
                onClick={() => setRotation((prev) => prev + 180)}
                className="border px-2 py-1 rounded-sm"
              >
                <FaArrowRotateRight size={15} color={iconColor} />
              </button>
            </div>

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
                <IoMoonOutline size={16} color="#4b5563" />
              ) : (
                <Sun size={16} color="white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {loadingDetails ? (
          <Loading />
        ) : finalUrl ? (
          <div
            ref={containerRef}
            className={`transition-all duration-300 ${
              theme === "dark"
                ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                : "shadow-lg"
            }`}
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
                renderAnnotationLayer={false}
                renderTextLayer
                className="pdf-page-high-quality"
              />
            </Document>
          </div>
        ) : (
          <div
            className={`text-lg ${
              theme === "dark"
                ? "text-gray-400"
                : "text-gray-500"
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