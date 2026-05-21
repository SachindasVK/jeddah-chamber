import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API = import.meta.env.VITE_API_URL;

const PdfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(600);
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth > 768 ? 700 : window.innerWidth - 64;
      setContainerWidth(width > 1000 ? 1000 : width);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  useEffect(() => {
    const fetchDocDetails = async () => {
      try {
        const res = await axios.get(`${API}/api/document/details/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        console.log(res.data);
        console.log(res.data.pdfPath);
        setDoc(res.data);
      } catch (err) {
        console.error("Could not fetch document details:", err);
        toast.error("Could not fetch document details");
        navigate("/admin/pdf-list");
      } finally {
        setLoading(false);
      }
    };
    fetchDocDetails();
  }, [id, adminToken, navigate]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white text-center p-4">
        Loading Viewer...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <Sidebar />

      {/* Added overflow-x-hidden to prevent horizontal scroll on mobile */}
      <div className="flex-1 p-4 md:p-8 bg-gray-800 flex flex-col items-center overflow-x-hidden">
        {/* Header Controls: Switched to flex-col on small screens */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl md:text-2xl font-bold text-white break-words">
              {doc?.title}
            </h1>
            <p className="text-gray-400 text-sm">
              Created: {new Date(doc?.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-600 transition whitespace-nowrap"
          >
            Back to List
          </button>
        </div>

        {/* Dynamic Container: Using React-PDF to prevent auto-download */}
        <div
          className="w-full sm:w-[95%] md:w-[85%] lg:w-[85%] max-w-[1000px] mb-10 relative mx-auto flex flex-col items-center"
        >
          {doc?.pdfPath ? (
            <div className="w-full flex flex-col items-center bg-gray-50 rounded shadow-2xl overflow-hidden pb-4">
              {/* Toolbar */}
              <div className="w-full bg-gray-200 p-2 flex justify-center items-center gap-4 border-b border-gray-300">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((prev) => prev - 1)}
                  className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-700 transition"
                >
                  Prev
                </button>
                <span className="text-gray-700 font-semibold">
                  Page {pageNumber} of {numPages || "--"}
                </span>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber((prev) => prev + 1)}
                  className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-700 transition"
                >
                  Next
                </button>
              </div>

              {/* Document rendering */}
              <div className="overflow-x-auto w-full flex justify-center p-4">
                <Document
                  file={doc.pdfPath}
                  onLoadSuccess={onDocumentLoadSuccess}
                  error={<div className="p-10 text-red-500">Failed to load PDF.</div>}
                  loading={<div className="p-10 text-gray-500">Loading PDF...</div>}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={containerWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    className="shadow-lg border border-gray-300"
                  />
                </Document>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white shadow-2xl flex flex-col items-center justify-center h-[500px] text-gray-400 p-6 text-center border rounded">
              <div className="mb-4 text-4xl md:text-5xl">📄</div>
              <p className="text-base md:text-lg font-semibold mb-2">
                No PDF Uploaded
              </p>
              <p className="text-xs md:text-sm">
                Please upload a document to see the preview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfDetails;
