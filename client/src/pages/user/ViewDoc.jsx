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
import { IoIosCloseCircleOutline } from "react-icons/io"

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Sun,
} from "lucide-react";

import Loading from "../../components/Loading/Loading";
import { Info } from "lucide-react";

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

  // FORMAT DATE
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // FORMAT STATUS
  const formatStatus = (status) => {
    if (!status) return "—";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

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
      <div
        className={`hidden lg:flex items-start justify-between px-10 py-10 text-right ${
          theme === "dark"
            ? "bg-[#d9d9d9] text-gray-800"
            : "bg-[#d9d9d9] text-gray-800"
        }`}
      >

         {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            السجل التجاري
          </span>

          <span className="text-[15px] tracking-wide">
            {doc?.subscriptionNumber || "—"}
          </span>
        </div>

        {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            رقم السجل التجاري
          </span>

          <span className="text-[15px] tracking-wide">
            {doc?.commercialRegisterNumber || "—"}
          </span>
        </div>

        {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            رقم الوثيقة
          </span>

          <span className="text-[15px] tracking-wide">
            {doc?.docNumber || "—"}
          </span>
        </div>


         {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[240px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            اسم المنشأة
          </span>

          <span
            dir="auto"
            className="text-[15px] text-center leading-8"
          >
            {doc?.establishmentName || "—"}
          </span>
        </div>


          {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            الحالة
          </span>

          <span className={`text-[15px] tracking-wide`}>
            "سارية"
          </span>
        </div>



        {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            تاريخ الإصدار
          </span>

          <span className="text-[15px] tracking-wide">
            {formatDate(doc?.creationDate)}
          </span>
        </div>


        {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            الرقم الموحد
          </span>

          <span className="text-[15px] tracking-wide">
            {doc?.unifiedNumber || "—"}
          </span>
        </div>


      


        {/* ITEM */}
        <div className="flex flex-col items-end text-right min-w-[120px]">
          <span dir="rtl" className="text-[13px] text-gray-500 font-medium mb-2">
            الرقم الإلكتروني
          </span>

          <span className="text-[15px] tracking-wide">
            {doc?.requestSubmitter || "—"}
          </span>
        </div>
      </div>
      {/* HEADER TOOLBAR */}
      <div
        className={`w-full sticky top-0 z-10 shadow-md border p-3 ${
          theme === "dark"
            ? "bg-[#1e293b] border-gray-700"
            : "bg-white border-gray-100"
        }`}
      >
        {/* MOBILE */}
        <div className="flex flex-col gap-2 lg:hidden">
          {/* TOP */}
          <div className="flex items-center gap-1.5">
            {/* SIDEBAR */}
            <div
              className={`${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              } border py-0.5 px-0.5 rounded-sm`}
            >
              <div
                onClick={() => setShowSidebar((prev) => !prev)}
                className={`flex border items-center py-0.5 px-0.5 rounded-sm cursor-pointer ${
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

            {/* PAGE CONTROLS */}
            <div
              className={`flex items-center gap-0.5 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              } border p-0.5 rounded-sm`}
            >
              <div
                className={`border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } px-1 flex items-center py-0.5 rounded-sm`}
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
                className={`border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } py-0 px-5 rounded-sm`}
              >
                <div
                  className={`px-1 sm:px-4 text-sm sm:text-base font-bold ${
                    theme === "dark" ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  {pageNumber}/{numPages || 1}
                </div>
              </div>

              <div
                className={`border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } px-1 flex items-center py-0.5 rounded-sm`}
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

            {/* DOWNLOAD */}
            <div
              className={`${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              } border p-0.5 rounded-sm`}
            >
              <div
                className={`flex border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } items-center px-1 py-0.5 rounded-sm`}
              >
                <button onClick={handleDownload}>
                  <Download size={15} color={iconColor} />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="flex items-center gap-1">
            {/* ZOOM */}
            <div
              className={`flex gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <div
                onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.3))}
                className={`border px-1 flex items-center rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button>
                  <ZoomOut size={15} color={iconColor} />
                </button>
              </div>

              <div
                onClick={() => setZoom((prev) => prev + 0.2)}
                className={`border px-1 flex items-center rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button>
                  <ZoomIn size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border px-1 flex items-center py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                } `}
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

            {/* ROTATION */}
            <div
              className={`flex gap-1 px-0.5 p-0.5 items-center rounded-sm border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border border-gray-300"
              }`}
            >
              <div
                className={`border py-0.5 px-1 rounded-sm flex items-center ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                } `}
              >
                <button onClick={() => setRotation((prev) => prev - 180)}>
                  <FaArrowRotateLeft
                    size={15}
                    color={iconColor}
                    className="border p-0.5 rounded-full"
                  />
                </button>
              </div>

              <div
                className={`border px-1 flex py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button onClick={() => setRotation((prev) => prev - 90)}>
                  <RotateCcw size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border px-1.5 flex items-center py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button onClick={() => setRotation((prev) => prev + 90)}>
                  <RotateCw size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border px-1 flex items-center py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
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

            {/* THEME */}
            <div
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="cursor-pointer"
            >
              <div
                className={`p-0.5 rounded-sm border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border border-gray-300"
                }`}
              >
                <div
                  className={`border p-0.5 rounded-sm ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-400"
                      : "bg-gray-100 border-gray-300"
                  }`}
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

        {/* DESKTOP */}
        <div className="hidden lg:flex items-center justify-between">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-2">
            {/* SIDEBAR */}
            <div
              className={`border py-0.5 px-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <div
                onClick={() => setShowSidebar((prev) => !prev)}
                className={`flex items-center py-0.5 px-0.5 rounded-sm cursor-pointer ${
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

            {/* PAGE CONTROLS */}
            <div
              className={`flex items-center gap-0.5 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              } border p-0.5 rounded-sm`}
            >
              <div
                className={`border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } px-1 flex items-center py-0.5 rounded-sm`}
              >
                <button
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                >
                  <FaChevronLeft size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } py-0 px-5 rounded-sm`}
              >
                <div
                  className={`px-4 text-sm font-bold ${
                    theme === "dark" ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  {pageNumber}/{numPages || 1}
                </div>
              </div>

              <div
                className={`border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } px-1 flex items-center py-0.5 rounded-sm`}
              >
                <button
                  onClick={() =>
                    setPageNumber((prev) => Math.min(prev + 1, numPages))
                  }
                >
                  <FaChevronRight size={15} color={iconColor} />
                </button>
              </div>
            </div>

            {/* DOWNLOAD */}
            <div
              className={`${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              } border p-0.5 rounded-sm`}
            >
              <div
                className={`flex border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } items-center px-1 py-0.5 rounded-sm`}
              >
                <button onClick={handleDownload}>
                  <Download size={15} color={iconColor} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1 rounded-sm">
            {/* ZOOM */}
            <div
              className={`flex gap-1 border p-0.5 rounded-sm ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <div
                onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.3))}
                className={`border px-1 flex items-center rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button>
                  <ZoomOut size={15} color={iconColor} />
                </button>
              </div>

              {/* ZOOM PERCENTAGE */}
              <div
                onClick={() => setZoom(1)}
                title="Reset zoom"
                className={`border px-2 py-0.5 flex items-center rounded-sm cursor-pointer select-none min-w-[48px] justify-center ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                <span className="text-xs font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div
                onClick={() => setZoom((prev) => prev + 0.2)}
                className={`border px-1 flex items-center rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button>
                  <ZoomIn size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border px-1 flex items-center py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                } `}
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

            {/* ROTATION */}
            <div
              className={`flex gap-1 px-0.5 p-0.5 items-center rounded-sm border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border border-gray-300"
              }`}
            >
              <div
                className={`border py-0.5 px-1 rounded-sm flex items-center ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                } `}
              >
                <button onClick={() => setRotation((prev) => prev - 180)}>
                  <FaArrowRotateLeft
                    size={15}
                    color={iconColor}
                    className="border p-0.5 rounded-full"
                  />
                </button>
              </div>

              <div
                className={`border px-1 flex py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button onClick={() => setRotation((prev) => prev - 90)}>
                  <RotateCcw size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border px-1.5 flex items-center py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <button onClick={() => setRotation((prev) => prev + 90)}>
                  <RotateCw size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border px-1 flex items-center py-0.5 rounded-sm ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
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

            {/* THEME */}
            <div
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="cursor-pointer"
            >
              <div
                className={`p-0.5 rounded-sm border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-100 border border-gray-300"
                }`}
              >
                <div
                  className={`border p-0.5 rounded-sm ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-400"
                      : "bg-gray-100 border-gray-300"
                  }`}
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
          <div className="lg:hidden flex justify-start py-6 px-3 mb-3">
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-700"
              } shadow-sm`}
            >
              <Info/>
            </button>
          </div>
          {/* MOBILE DOCUMENT DETAILS */}
{showInfo && (
  <div className={`lg:hidden fixed inset-0 z-50 bg-[#f3f3f3] overflow-y-auto ${
          theme === "dark"
            ? "bg-[#1e293b] text-gray-200"
            : "bg-white text-gray-900"
        }` }>
    {/* HEADER */}
    <div className="sticky top-0 bg-[#f3f3f3] z-20">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setShowInfo(false)}
          className="flex items-center justify-center"
        >
          <span className="text-[40px] text-gray-300">
            <IoIosCloseCircleOutline />
          </span>
        </button>

        {/* TITLE */}
        <h2
          dir="rtl"
          className="text-[30px] font-extrabold text-[#12385b]"
        >
          معلومات الوثيقة
        </h2>
      </div>

      <div className="border-b border-gray-300" />
    </div>

    {/* CONTENT */}
    <div className="px-8 pt-10 pb-24">
      <div className="flex flex-col gap-10">
        {/* DOC NUMBER */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            رقم الوثيقة
          </p>

          <p className="text-[23px] font-medium text-gray-800">
            {doc?.docNumber || "—"}
          </p>
        </div>

        {/* commercial Register Number */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            رقم السجل التجاري
          </p>

          <p className="text-[23px] font-medium text-gray-800">
            {doc?.commercialRegisterNumber || "—"}
          </p>
        </div>

        {/* UNIFIED NUMBER */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            الرقم الموحد
          </p>

          <p className="text-[23px] font-medium text-gray-800">
            {doc?.unifiedNumber || "—"}
          </p>
        </div>

        {/* DATE */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            تاريخ الإنشاء
          </p>

          <p className="text-[23px] font-medium text-gray-800">
            {formatDate(doc?.creationDate)}
          </p>
        </div>

        {/* STATUS */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            حالة الوثيقة
          </p>

          <p className="text-[23px] font-medium text-gray-800">
            سارية
          </p>
        </div>

        {/* ESTABLISHMENT */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            اسم المنشأة
          </p>

          <p
            dir="rtl"
            className="text-[23px] font-medium text-gray-800 leading-[55px]"
          >
            {doc?.establishmentName || "—"}
          </p>
        </div>

        {/* COMMERCIAL REG */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          > 
            السجل التجاري
          </p>

          <p className="text-[23px] font-medium text-gray-800">
            {doc?.subscriptionNumber || "—"}
          </p>
        </div>

        {/* REQUEST SUBMITTER */}
        <div className="text-right">
          <p
            dir="rtl"
            className="text-[20px] font-bold text-gray-600 mb-4"
          >
            مقدم الطلب
          </p>

          <p
            dir="rtl"
            className="text-[23px] font-medium text-gray-800 leading-[55px]"
          >
            {doc?.requestSubmitter || "—"}
          </p>
        </div>
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
