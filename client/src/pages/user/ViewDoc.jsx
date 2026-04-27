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
        className={`w-full sticky top-0 z-10 flex flex-col gap-2 p-3 shadow-md border ${theme === "dark" ? "bg-[#1e293b] border-gray-700" : "bg-white border-gray-100"}`}
      >
        <div className="flex items-center w-full gap-1.5">
          <div
            className={`${
              theme === "dark"
                ? "bg-gray-800 border-gray-600"
                : "bg-gray-100 border-gray-300"
            } border py-0.5 px-0.5 rounded-sm`}
          >
            <div
              onClick={() => setShowSidebar((prev) => !prev)}
              className={`borde flex items-center py-0.5 px-0.5 rounded-sm cursor-pointer ${
                showSidebar
                  ? "bg-blue-700 border-blue-700"
                  : theme === "dark"
                    ? "border-gray-600"
                    : "border-gray-300"
              }`}
            >
              <img
                src="data:image/png;base64,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"
                alt=""
              />
            </div>
          </div>

          <div
            className={`flex items-center gap-0.5 ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}
          >
            <div
              className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"}  px-1 flex items-center py-0.5 rounded-sm`}
            >
              <button
                onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
              >
                <FaChevronLeft
                  size={15}
                  color={pageNumber <= 1 ? "#64748b" : iconColor}
                />
              </button>
            </div>
            <div
              className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} py-0  px-5 rounded-sm`}
            >
              <div
                className={`px-1 sm:px-4 text-sm sm:text-base font-bold ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}
              >
                {pageNumber}/{numPages || 1}
              </div>
            </div>

            <div
              className={`border ${theme === "dark" ? "border-gray-600" : "border-gray-300"}  px-1 flex items-center py-0.5 rounded-sm`}
            >
              <button
                onClick={() =>
                  setPageNumber((prev) => Math.min(prev + 1, numPages))
                }
                disabled={pageNumber >= numPages}
              >
                <FaChevronRight
                  size={15}
                  color={pageNumber >= numPages ? "#64748b" : iconColor}
                />
              </button>
            </div>
          </div>
          <div className="flex">
            <div
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}
            >
              <div
                className={`flex border ${theme === "dark" ? "border-gray-600" : "border-gray-300"} flex items-center px-1 py-0.5 rounded-sm`}
              >
                <button onClick={handleDownload}>
                  <Download size={15} color={iconColor} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          <div
            className={`flex gap-1 ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}
          >
            <div
              onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.3))}
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-1 flex items-center rounded-sm`}
            >
              <button>
                <ZoomOut size={15} color={iconColor} />
              </button>
            </div>

            <div
              onClick={() => setZoom((prev) => prev + 0.2)}
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-1 flex items-center rounded-sm`}
            >
              <button>
                <ZoomIn size={15} color={iconColor} />
              </button>
            </div>

            <div
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-1 flex items-center py-0.5 rounded-sm`}
            >
              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
              >
                <MoveHorizontal size={15} color={iconColor} />
              </button>
            </div>
          </div>

          {/* Rotation Section */}
          <div
            className={`flex gap-1 px-0.5 p-0.5 items-center rounded-sm ${theme === "dark" ? "border border-gray-600" : "bg-gray-100 border border-gray-300"}`}
          >
            {/* Counter-Clockwise 180 (Double Rotate) */}
            <div
              className={`flex items-center ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border py-0.5 px-1 rounded-sm`}
            >
              <button onClick={() => setRotation((prev) => prev - 180)}>
                <FaArrowRotateLeft
                  size={15}
                  color={iconColor}
                  className="border p-0.5 rounded-full"
                />
              </button>
            </div>

            {/* Counter-Clockwise 90 */}
            <div
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-1 flex py-0.5 rounded-sm`}
            >
              <button onClick={() => setRotation((prev) => prev - 90)}>
                <RotateCcw size={15} color={iconColor} />
              </button>
            </div>

            {/* Clockwise 90 */}
            <div
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-1.5 flex items-center py-0.5 rounded-sm`}
            >
              <button onClick={() => setRotation((prev) => prev + 90)}>
                <RotateCw size={15} color={iconColor} />
              </button>
            </div>

            {/* Clockwise 180 (Double Rotate) */}
            <div
              className={`${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"} border px-1 flex items-center py-0.5 rounded-sm`}
            >
              <button onClick={() => setRotation((prev) => prev + 180)}>
                <FaArrowRotateRight
                  size={15}
                  color={iconColor}
                  className="border p-0.5 rounded-full"
                />
              </button>
            </div>
          </div>

          <div
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="cursor-pointer"
          >
            <div
              className={`p-0.5 rounded-sm ${theme === "dark" ? "border border-gray-600" : "bg-gray-100 border border-gray-300"}`}
            >
              <div
                className={`${theme === "dark" ? "bg-gray-700 border-gray-400" : "bg-gray-100 border-gray-300"} border p-0.5 rounded-sm`}
              >
                {theme === "light" ? (
                  <IoMoonOutline size={15} color="#4b5563" />
                ) : (
                  <Sun size={15} color="white" />
                )}
              </div>
            </div>
          </div>
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
            <Document file={finalUrl}>
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
              error={
                <div className="p-20 text-red-500">Failed to load PDF.</div>
              }
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
          <div
            className={`p-20 text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          >
            No PDF document available.
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDoc;
