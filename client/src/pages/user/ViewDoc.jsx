import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { MdViewSidebar } from "react-icons/md";

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
  Info,
} from "lucide-react";

import Loading from "../../components/Loading/Loading";

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
    localStorage.getItem("docTheme") || "light",
  );

  const [showInfo, setShowInfo] = useState(false);

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";

  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  // CHECK IF DETAILS EXIST
  const hasDocumentDetails =
    doc?.docNumber ||
    doc?.unifiedNumber ||
    doc?.creationDate ||
    doc?.docStatus ||
    doc?.establishmentName ||
    doc?.subscriptionNumber ||
    doc?.requestSubmitter ||
    doc?.uniqueId;

  // FORMAT DATE
  const formattedDate = doc?.creationDate
    ? new Date(doc.creationDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // RESPONSIVE WIDTH
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

  // PINCH ZOOM
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

  // SAVE THEME
  useEffect(() => {
    localStorage.setItem("docTheme", theme);
  }, [theme]);

  // FETCH DOC
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/document/view/${id}`,
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

  // PDF SUCCESS
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // DOWNLOAD
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
      {/* DESKTOP DOCUMENT DETAILS */}
      {finalUrl && hasDocumentDetails && (
        <div
          dir="rtl"
          className={`hidden lg:flex items-start justify-between px-10 py-10 gap-8 overflow-x-auto ${
            theme === "dark"
              ? "bg-[#d9d9d9] text-gray-800"
              : "bg-[#d9d9d9] text-gray-800"
          }`}
        >
          {doc?.docNumber && (
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                رقم الوثيقة
              </span>

              <span className="text-[20px] font-semibold tracking-wide">
                {doc.docNumber}
              </span>
            </div>
          )}

          {doc?.unifiedNumber && (
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                الرقم الموحد
              </span>

              <span className="text-[20px] font-semibold tracking-wide">
                {doc.unifiedNumber}
              </span>
            </div>
          )}

          {doc?.creationDate && (
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                تاريخ الإنشاء
              </span>

              <span className="text-[20px] font-semibold tracking-wide">
                {formattedDate}
              </span>
            </div>
          )}

          {doc?.docStatus && (
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                حالة الوثيقة
              </span>

              <span className="text-[20px] font-semibold tracking-wide">
                {doc.docStatus === "active"
                  ? "سارية"
                  : doc.docStatus === "inactive"
                    ? "غير نشطة"
                    : "مؤرشفة"}
              </span>
            </div>
          )}

          {doc?.establishmentName && (
            <div className="flex flex-col items-center min-w-[240px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                اسم المنشأة
              </span>

              <span className="text-[20px] font-semibold text-center leading-8">
                {doc.establishmentName}
              </span>
            </div>
          )}

          {doc?.subscriptionNumber && (
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                السجل التجاري
              </span>

              <span className="text-[20px] font-semibold tracking-wide">
                {doc.subscriptionNumber}
              </span>
            </div>
          )}

          {doc?.uniqueId && (
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                رقم الاشتراك
              </span>

              <span className="text-[20px] font-semibold tracking-wide">
                {doc.uniqueId}
              </span>
            </div>
          )}

          {doc?.requestSubmitter && (
            <div className="flex flex-col items-center min-w-[220px]">
              <span className="text-[13px] text-gray-500 font-medium mb-2">
                مقدم الطلب
              </span>

              <span className="text-[18px] font-semibold text-center leading-7">
                {doc.requestSubmitter}
              </span>
            </div>
          )}
        </div>
      )}

      {/* HEADER TOOLBAR */}
      <div
        className={`w-full sticky top-0 z-10 shadow-md border p-3 ${
          theme === "dark"
            ? "bg-[#1e293b] border-gray-700"
            : "bg-white border-gray-100"
        }`}
      >
        {/* YOUR TOOLBAR CODE REMAINS SAME */}
      </div>

      {/* PDF THUMBNAIL SIDEBAR */}
      <div
        className={`fixed bottom-0 left-0 w-full z-20 transition-all duration-300 ${
          showSidebar
            ? "translate-y-0 opacity-100 visible"
            : "translate-y-full opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setShowSidebar(false)}
        />

        <div className="relative bg-blue-700 h-[147px] flex items-center overflow-x-auto gap-2 shadow-2xl px-2">
          {finalUrl && (
            <Document file={finalUrl} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages || 0), (_, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setPageNumber(index + 1);
                    setShowSidebar(false);
                  }}
                  className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                    pageNumber === index + 1
                      ? "border-white"
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

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* PDF VIEWER */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-auto py-4 relative ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-100"
          }`}
          style={{
            height: "calc(100vh - 140px)",
            touchAction: "pan-x pan-y",
          }}
        >
          {loadingDetails ? (
            <Loading />
          ) : finalUrl ? (
            <div
              className={`w-max mx-auto transition-all duration-300 h-fit ${
                theme === "dark"
                  ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  : "shadow-lg"
              }`}
            >
              <Document file={finalUrl} onLoadSuccess={onDocumentLoadSuccess}>
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
              className={`flex items-center justify-center h-full text-lg ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No PDF document available.
            </div>
          )}

          {/* MOBILE INFO BUTTON */}
          {finalUrl && hasDocumentDetails && (
            <div className="lg:hidden flex justify-start px-3 mb-3">
              <button
                onClick={() => setShowInfo((prev) => !prev)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-700"
                } shadow-sm`}
              >
                <Info size={18} />
              </button>
            </div>
          )}

          {/* MOBILE DOCUMENT DETAILS */}
          {showInfo && finalUrl && hasDocumentDetails && (
            <div className="lg:hidden px-3 mb-4">
              <div
                dir="rtl"
                className={`rounded-md p-3 border text-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                <div className="grid grid-cols-2 gap-3">
                  {doc?.docNumber && (
                    <div>
                      <p className="text-xs text-gray-400">رقم الوثيقة</p>

                      <p className="font-semibold">{doc.docNumber}</p>
                    </div>
                  )}

                  {doc?.unifiedNumber && (
                    <div>
                      <p className="text-xs text-gray-400">الرقم الموحد</p>

                      <p className="font-semibold">{doc.unifiedNumber}</p>
                    </div>
                  )}

                  {doc?.creationDate && (
                    <div>
                      <p className="text-xs text-gray-400">تاريخ الإنشاء</p>

                      <p className="font-semibold">{formattedDate}</p>
                    </div>
                  )}

                  {doc?.docStatus && (
                    <div>
                      <p className="text-xs text-gray-400">حالة الوثيقة</p>

                      <p className="font-semibold text-green-500">
                        {doc.docStatus === "active"
                          ? "سارية"
                          : doc.docStatus === "inactive"
                            ? "غير نشطة"
                            : "مؤرشفة"}
                      </p>
                    </div>
                  )}

                  {doc?.establishmentName && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">اسم المنشأة</p>

                      <p className="font-semibold">
                        {doc.establishmentName}
                      </p>
                    </div>
                  )}

                  {doc?.subscriptionNumber && (
                    <div>
                      <p className="text-xs text-gray-400">السجل التجاري</p>

                      <p className="font-semibold">
                        {doc.subscriptionNumber}
                      </p>
                    </div>
                  )}

                  {doc?.uniqueId && (
                    <div>
                      <p className="text-xs text-gray-400">رقم الاشتراك</p>

                      <p className="font-semibold">{doc.uniqueId}</p>
                    </div>
                  )}

                  {doc?.requestSubmitter && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">مقدم الطلب</p>

                      <p className="font-semibold">
                        {doc.requestSubmitter}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDoc;