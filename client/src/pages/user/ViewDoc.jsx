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
import side from '../../assets/Sidebar.jpeg'

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
              className={`border flex items-center py-0.5 px-0.5 rounded-sm cursor-pointer ${
                showSidebar
                  ? "bg-blue-700 border-blue-700"
                  : theme === "dark"
                    ? "border-gray-600"
                    : "border-gray-300"
              }`}
            >
              <img src={side} alt="" />
              <MdViewSidebar
                size={15}
                color={showSidebar ? "#ffffff" : iconColor}
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
