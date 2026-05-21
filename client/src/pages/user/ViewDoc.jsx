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
                <FaArrowsLeftRightToLine size={15} color={iconColor} />
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
         

          {/* Details Section */}
          <div className="space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider pb-2 border-b ${
              theme === "dark" ? "text-gray-400 border-gray-700" : "text-gray-500 border-gray-100"
            }`}>
              تفاصيل التحقق / Verification Details
            </h4>

            <div className="space-y-3.5">
              {/* Status Row */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                theme === "dark" ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/50 border-slate-100"
              }`}>
          
                  <div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400">حالة الوثيقة</div>
                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">Document Status</div>
                  </div>
                </div>
                <div>
                  {doc?.docStatus === "active" ? (
                    <span className="inline-flex flex-col items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
                      <span>نشطة</span>
                      <span className="text-[9px] font-semibold">Active</span>
                    </span>
                  ) : doc?.docStatus === "inactive" ? (
                    <span className="inline-flex flex-col items-center px-3 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-900/50">
                      <span>غير نشطة</span>
                      <span className="text-[9px] font-semibold">Inactive</span>
                    </span>
                  ) : doc?.docStatus === "archived" ? (
                    <span className="inline-flex flex-col items-center px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-900/50">
                      <span>مؤرشفة</span>
                      <span className="text-[9px] font-semibold">Archived</span>
                    </span>
                  ) : (
                    <span className="inline-flex flex-col items-center px-3 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600/50">
                      <span>غير محدد</span>
                      <span className="text-[9px] font-semibold">Unknown</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Detail Rows */}
              {[
                {
                  labelAr: "اسم المنشأة",
                  labelEn: "Establishment Name",
                  value: doc?.establishmentName,
                },
                {
                  labelAr: "رقم الوثيقة",
                  labelEn: "Document Number",
                  value: doc?.docNumber,
                
                },
                {
                  labelAr: "الرقم الموحد",
                  labelEn: "Unified Number",
                  value: doc?.unifiedNumber,
                 
                },
                {
                  labelAr: "تاريخ الإنشاء",
                  labelEn: "Creation Date",
                  value: doc?.creationDate ? new Date(doc.creationDate).toLocaleDateString("ar-SA", { year: 'numeric', month: 'long', day: 'numeric' }) + " / " + new Date(doc.creationDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : null,
                 
                },
                {
                  labelAr: "رقم الإشتراك",
                  labelEn: "Subscription Number",
                  value: doc?.subscriptionNumber,
              
                },
                {
                  labelAr: "مقدم الطلب",
                  labelEn: "Request Submitter",
                  value: doc?.requestSubmitter,
                 
                },
              ].map((item, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                  theme === "dark" ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/50 border-slate-100"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-300" : "bg-white text-gray-500 shadow-sm"}`}>
                    
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.labelAr}</div>
                      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{item.labelEn}</div>
                    </div>
                  </div>
                 <div className={`text-sm font-bold text-right ${
  theme === "dark" ? "text-slate-100" : "text-slate-800"
}`}>
  {item.value || "-"}
</div>
                </div>
              ))}
            </div>
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
