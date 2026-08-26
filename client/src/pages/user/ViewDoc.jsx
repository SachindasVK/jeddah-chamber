import { useEffect, useRef, useState } from "react";
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
  FaInfo
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

  const pinchStartRef = useRef(null);
  const pinchScaleRef = useRef(1);
  const pdfPageRef = useRef(null);

  const iconColor = theme === "dark" ? "#e2e8f0" : "#4b5563";

  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  const clampZoom = (value) => Math.min(Math.max(value, 0.3), 4);

  const getTouchDistance = (touches) => {
    const horizontalDistance = touches[0].clientX - touches[1].clientX;
    const verticalDistance = touches[0].clientY - touches[1].clientY;

    return Math.hypot(horizontalDistance, verticalDistance);
  };

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      pinchStartRef.current = {
        distance: getTouchDistance(event.touches),
        zoom,
      };
      pinchScaleRef.current = 1;
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 2 || !pinchStartRef.current) return;

    event.preventDefault();

    const distance = getTouchDistance(event.touches);
    const scale = distance / pinchStartRef.current.distance;
    pinchScaleRef.current = scale;

    if (pdfPageRef.current) {
      pdfPageRef.current.style.transform = `scale(${scale})`;
      pdfPageRef.current.style.transformOrigin = "center top";
    }
  };

  const handleTouchEnd = (event) => {
    if (event.touches.length < 2) {
      if (pinchStartRef.current) {
        setZoom(clampZoom(
          pinchStartRef.current.zoom * pinchScaleRef.current,
        ));
      }

      pinchStartRef.current = null;
      pinchScaleRef.current = 1;

      requestAnimationFrame(() => {
        if (pdfPageRef.current) {
          pdfPageRef.current.style.transform = "";
          pdfPageRef.current.style.transformOrigin = "";
        }
      });
    }
  };

  const hasDetails = !!(
    doc &&
    (
      (doc.subscriptionNumber && String(doc.subscriptionNumber).trim() !== "") ||
      (doc.commercialRegisterNumber && String(doc.commercialRegisterNumber).trim() !== "") ||
      (doc.docNumber && String(doc.docNumber).trim() !== "") ||
      (doc.establishmentName && String(doc.establishmentName).trim() !== "") ||
      (doc.creationDate && String(doc.creationDate).trim() !== "") ||
      (doc.unifiedNumber && String(doc.unifiedNumber).trim() !== "") ||
      (doc.requestSubmitter && String(doc.requestSubmitter).trim() !== "")
    )
  );

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
      {!loadingDetails && finalUrl && hasDetails && (
        <div
          dir="rtl"
          className={`hidden lg:flex flex-col gap-6 pr-20 px-15 py-6 border-b ${
            theme === "dark"
              ? "bg-[#1e293b] border-gray-800 text-gray-100"
              : "bg-olive-200 border-gray-200 text-black"
          }`}
        >
          {/* Row 1: The 7 details columns */}
          <div className="flex flex-row justify-between items-start w-full gap-4">
            
            {/* رقم الوثيقة */}
            <div className="flex flex-col items-center text-center">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                رقم الوثيقة
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {doc?.docNumber || "—"}
              </span>
            </div>

            {/* الرقم الموحد */}
            <div className="flex flex-col items-center text-center">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                الرقم الموحد
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {doc?.unifiedNumber || "—"}
              </span>
            </div>

            {/* تاريخ الإنشاء */}
            <div className="flex flex-col items-center text-center">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                تاريخ الإنشاء
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {formatDate(doc?.creationDate)}
              </span>
            </div>

            {/* حالة الوثيقة */}
            <div className="flex flex-col items-center text-center">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                حالة الوثيقة
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                سارية
              </span>
            </div>

            {/* اسم المنشأة */}
            <div className="flex flex-col items-center text-center max-w-[240px]">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                اسم المنشأة
              </span>
              <span className={`text-[15px] font-medium leading-relaxed ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {doc?.establishmentName || "—"}
              </span>
            </div>

            {/* رقم السجل التجاري */}
            <div className="flex flex-col items-center text-center">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                رقم السجل التجاري
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {doc?.commercialRegisterNumber || "—"}
              </span>
            </div>

            {/* رقم الإشتراك */}
            <div className="flex flex-col items-center text-center">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                رقم الإشتراك
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {doc?.subscriptionNumber || "—"}
              </span>
            </div>

          </div>

          {/* Row 2: Submitter */}
          {doc?.requestSubmitter && (
            <div className="flex flex-col items-start text-right mt-2 self-start">
              <span className={`text-[12px] font-semibold mb-2 ${
                theme === "dark" ? "text-gray-400" : "text-black"
              }`}>
                مقدم الطلب
              </span>
              <span className={`text-[15px] font-medium ${
                theme === "dark" ? "text-gray-200" : "text-black"
              }`}>
                {doc?.requestSubmitter}
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
                className={`flex items-center border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } px-1 py-0.5 rounded-sm`}
              >
                <button
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                >
                  <FaChevronLeft size={15} color={iconColor} />
                </button>
              </div>

              <div
                className={`border flex items-center ${
                  theme === "dark" ? "border-gray-600" : "border-gray-300"
                } py-0 px-5 rounded-sm`}
              >
                <div
                  className={`px-4 text-sm py-0 font-bold ${
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

      {/* PDF THUMBNAIL SIDEBAR — MOBILE (bottom slide-up) */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 w-full z-20 transition-all duration-300 ${
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

      {/* PDF THUMBNAIL SIDEBAR — DESKTOP (left slide-in) */}
      <div
        className={`hidden lg:block fixed top-0 left-0 h-full z-20 transition-all duration-300 ${
          showSidebar
            ? "translate-x-0 opacity-100 visible"
            : "-translate-x-full opacity-0 invisible pointer-events-none"
        }`}
        style={{ width: "140px" }}
      >
        {/* backdrop (click outside to close) */}
        <div
          className="fixed inset-0"
          onClick={() => setShowSidebar(false)}
        />

        <div
          className={`relative h-full flex flex-col items-center overflow-y-auto gap-3 shadow-2xl py-4 px-2 ${
            theme === "dark" ? "bg-[#1e293b]" : "bg-blue-700"
          }`}
        >
          {finalUrl && (
            <Document file={finalUrl} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages || 0), (_, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setPageNumber(index + 1);
                    setShowSidebar(false);
                  }}
                  className={`cursor-pointer border-2 rounded-md overflow-hidden flex-shrink-0 ${
                    pageNumber === index + 1
                      ? "border-white"
                      : "border-transparent"
                  }`}
                >
                  <Page
                    pageNumber={index + 1}
                    width={110}
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
          className={`flex-1 overflow-auto py-4 relative ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-100"
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{
            height: "calc(100vh - 140px)",
            touchAction: "pan-x pan-y",
          }}
        >
          {loadingDetails ? (
            <Loading />
          ) : finalUrl ? (
            <div
              ref={pdfPageRef}
              className={`w-max mx-auto h-fit ${
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
          {!loadingDetails && finalUrl && hasDetails && numPages && (
            <div className="lg:hidden flex justify-start pt-60 px-3 pl-5 mb-5">
              <div className="info-btn-wrap">
                <div className="info-pulse info-pulse-1" />
                <div className="info-pulse info-pulse-2" />
                <div className="info-pulse info-pulse-3" />
                <button
                  onClick={() => setShowInfo((prev) => !prev)}
                  className={`relative z-6 w-8 h-8 rounded-full border flex items-center justify-center font-bold ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-800 text-white"
                      : "bg-gray-500 border-gray-500 text-white"
                  } shadow-sm`}
                >
                  <FaInfo />
                </button>
              </div>
            </div>
          )}


{/* MOBILE DOCUMENT DETAILS — Bottom Sheet */}
<div
  className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
    showInfo ? "visible" : "invisible pointer-events-none"
  }`}
>
  {/* BACKDROP */}
  <div
    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
      showInfo ? "opacity-100" : "opacity-0"
    }`}
    onClick={() => setShowInfo(false)}
  />

  {/* BOTTOM SHEET */}
  <div
    className={`absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden transition-transform duration-300 ease-out ${
      showInfo ? "translate-y-0" : "translate-y-full"
    } ${
      theme === "dark"
        ? "bg-[#1e293b] text-gray-200"
        : "bg-white text-gray-900"
    }`}
    style={{ maxHeight: "50vh" }}
  >
    {/* DRAG HANDLE */}
    <div className="flex justify-center pt-3 pb-1">
      <div
        className={`w-10 h-1 rounded-full ${
          theme === "dark" ? "bg-gray-600" : "bg-gray-300"
        }`}
      />
    </div>

    {/* HEADER */}
    <div
      className={`sticky top-0 z-20 ${
        theme === "dark" ? "bg-[#1e293b]" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between px-5 pt-3 pb-4">
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setShowInfo(false)}
          className="flex items-center justify-center"
        >
          <span
            className={`text-[36px] ${
              theme === "dark" ? "text-gray-400" : "text-gray-400"
            }`}
          >
            <IoIosCloseCircleOutline />
          </span>
        </button>

        {/* TITLE */}
        <h2
          dir="rtl"
          className={`text-[22px] font-semibold ${
            theme === "dark" ? "text-white" : "text-[#12385b]"
          }`}
        >
          معلومات الوثيقة
        </h2>
      </div>

      <div
        className={`border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}
      />
    </div>

    {/* SCROLLABLE CONTENT */}
    <div className="overflow-y-auto px-8 pt-8 pb-10" style={{ maxHeight: "calc(50vh - 100px)" }}>
      <div className="flex flex-col gap-8">
        {/* DOC NUMBER */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            رقم الوثيقة
          </p>
          <p
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {doc?.docNumber || "—"}
          </p>
        </div>

        {/* UNIFIED NUMBER */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            الرقم الموحد
          </p>
          <p
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {doc?.unifiedNumber || "—"}
          </p>
        </div>

        {/* DATE */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            تاريخ الإنشاء
          </p>
          <p
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {formatDate(doc?.creationDate)}
          </p>
        </div>

        {/* STATUS */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            حالة الوثيقة
          </p>
          <p
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            سارية
          </p>
        </div>

        {/* ESTABLISHMENT */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            اسم المنشأة
          </p>
          <p
            dir="rtl"
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {doc?.establishmentName || "—"}
          </p>
        </div>

        {/* COMMERCIAL REGISTER NUMBER */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            رقم السجل التجاري
          </p>
          <p
            className={`text-[17px] font-medium underline ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {doc?.commercialRegisterNumber || "—"}
          </p>
        </div>

        {/* COMMERCIAL RECORD */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            رقم الإشتراك
          </p>

          <p
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {doc?.subscriptionNumber || "—"}
          </p>
        </div>

        {/* REQUEST SUBMITTER */}
        <div className="text-right">
          <p
            dir="rtl"
            className={`text-[13px] font-semibold mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            مقدم الطلب
          </p>
          <p
            dir="rtl"
            className={`text-[17px] font-medium ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {doc?.requestSubmitter || "—"}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default ViewDoc;
