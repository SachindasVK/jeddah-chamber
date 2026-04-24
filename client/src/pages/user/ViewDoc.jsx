import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";
import Loading from "../../components/Loading/Loading";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
  const [rotation, setRotation] = useState(0);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  // 📱 Responsive width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth > 640 ? 600 : window.innerWidth - 32;
      setContainerWidth(width);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 📦 Fetch document
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/document/view/${id}`
        );
        setDoc(res.data);
      } catch (err) {
        toast.error("Failed to load document");
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [id]);

  // 📄 PDF loaded
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // 🤏 Pinch Zoom (smooth)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getDistance = (t1, t2) =>
      Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);

    const onTouchMove = (e) => {
      if (e.touches.length !== 2) return;

      e.preventDefault();

      const distance = getDistance(e.touches[0], e.touches[1]);

      if (!lastDistance.current) {
        lastDistance.current = distance;
        return;
      }

      const scale = distance / lastDistance.current;

      setZoom((prev) => {
        const next = prev * scale;
        return Math.min(Math.max(next, 0.5), 3);
      });

      lastDistance.current = distance;
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

  // ⬇️ Download
  const handleDownload = async () => {
    try {
      const res = await axios.get(finalUrl, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "document.pdf";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="p-3 bg-white shadow flex gap-2 flex-wrap">
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
          Zoom -
        </button>
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
          Zoom +
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
        >
          Reset
        </button>
        <button onClick={() => setRotation((r) => r + 90)}>Rotate</button>
        <button onClick={handleDownload}>Download</button>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center items-start p-4"
        style={{ touchAction: "none" }}
      >
        {loadingDetails ? (
          <Loading />
        ) : finalUrl ? (
          <div
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: "transform 0.08s ease-out",
            }}
          >
            <Document
              file={finalUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loading />}
              error={<div>Failed to load PDF</div>}
            >
              <Page
                pageNumber={pageNumber}
                width={containerWidth}
                renderTextLayer={false} // 🔥 improves performance
                renderAnnotationLayer={false}
                devicePixelRatio={1.5}
              />
            </Document>
          </div>
        ) : (
          <div>No document found</div>
        )}
      </div>
    </div>
  );
};

export default ViewDoc;