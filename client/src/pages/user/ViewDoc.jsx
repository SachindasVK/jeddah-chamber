import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Document, Page, pdfjs } from "react-pdf";

// Essential styles for react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Moon,
  Sun,
  MoveHorizontal,
  Columns
} from "lucide-react";

// Fix for the Version Mismatch Error
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ViewDoc = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("docTheme") || "light");

  const finalUrl = doc?.pdfUrl || doc?.pdfPath;

  useEffect(() => {
    localStorage.setItem("docTheme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`http://172.20.10.5:5000/api/document/view/${id}`);
        setDoc(res.data);
      } catch (err) {
        toast.error("Verification failed");
      }
    };
    fetchDetails();
  }, [id]);

  if (!doc) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className={`min-h-screen flex flex-col items-center py-4 sm:py-8 transition-colors duration-300 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f4f7f9]"}`}>
      
      {/* Header Toolbar - Your exact structure */}
      <div className={`w-full max-w-full flex flex-col sm:flex-row justify-between items-center gap-4 p-4 shadow-sm border ${theme === "dark" ? "bg-[#1e293b] border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 border border-gray-300 p-2 rounded-sm"><Columns size={20} color="#4b5563" /></div>
          
          <div className="flex gap-2 bg-gray-100 border border-gray-300 p-2 rounded-md">
            <FaChevronLeft color="#4b5563" />
            <span className="px-6 font-bold text-gray-600">1/1</span>
            <FaChevronRight color="#4b5563" />
          </div>

          <a href={finalUrl} download className="bg-gray-100 border border-gray-300 p-2 rounded-md">
            <Download size={20} color="#4b5563" />
          </a>
        </div>

        <div className="flex gap-3">
          <div className="flex gap-2 bg-gray-100 border border-gray-300 p-2 rounded-md">
            <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}><ZoomOut size={20} color="#4b5563" /></button>
            <button onClick={() => setZoom(prev => Math.max(prev + 0.1))}><ZoomIn size={20} color="#4b5563" /></button>
            <button onClick={() => {setZoom(1); setRotation(0);}}><MoveHorizontal size={20} color="#4b5563" /></button>
          </div>
          
          <div className="flex gap-2 bg-gray-100 border border-gray-300 p-2 rounded-md">
            <button onClick={() => setRotation(prev => prev - 90)}><RotateCcw size={20} color="#4b5563" /></button>
            <button onClick={() => setRotation(prev => prev + 90)}><RotateCw size={20} color="#4b5563" /></button>
          </div>

          <div onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="cursor-pointer p-1 rounded-md">
            <div className={`p-2 rounded-md ${theme === "dark" ? "bg-amber-500" : "bg-gray-100 border border-gray-300"}`}>
              {theme === "light" ? <Moon size={20} color="#4b5563" /> : <Sun size={20} color="white" />}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Container - No External Scrollbars, White BG */}
      <div
        className={`w-full max-w-full mt-1 transition-all overflow-auto flex justify-center ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"}`}
        style={{
          height: "90vh",
          scrollbarWidth: "none", // Hide scrollbar Firefox
          msOverflowStyle: "none"  // Hide scrollbar IE/Edge
        }}
      >
        <div 
          className="transition-all duration-300"
          style={{ 
            filter: theme === "dark" ? "invert(0.9) hue-rotate(180deg) brightness(1.1)" : "none"
          }}
        >
          <Document
            file={finalUrl}
            loading={<div className="p-20 text-gray-400">Loading Document...</div>}
          >
            <Page 
              pageNumber={1} 
              scale={zoom} 
              rotate={rotation}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              canvasBackground="white" // Forces internal white background
            />
          </Document>
        </div>
      </div>
    
    </div>
  );
};

export default ViewDoc;