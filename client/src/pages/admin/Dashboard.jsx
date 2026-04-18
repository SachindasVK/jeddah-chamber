import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import {toast} from "react-hot-toast"
import Sidebar from "../../components/Sidebar";


const Dashboard = () => {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");

  // Form States
  const [docId, setDocId] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!adminToken) {
    navigate("/admin/login");
    return null;
  }

  // Generate QR
  const handleGenerateQR = async () => {
  if (!docTitle.trim()) return toast.error("Please enter a document title");

  setQrLoading(true);
  try {
    const res = await axios.post(
      "http://localhost:5000/api/document/generate",
      { title: docTitle.trim() }, 
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    setQrPreview(res.data.qrCodeImage);

    if (res.data.document && res.data.document._id) {
      setDocId(res.data.document._id);
      toast.success("QR Generated Successfully");
    }
  } catch (err) {
    if (err.response) {
      if (err.response.status === 400) {
        toast.error(err.response.data.message || "Document title already exists");
      } else if (err.response.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Server error. Please try again later.");
      }
    } else if (err.request) {
      toast.error("Cannot connect to server. Check your network.");
    } else {
      toast.error("An unexpected error occurred.");
    }
    
    console.error("QR Error:", err);
  } finally {
    setQrLoading(false);
  }
};

  // Upload PDF
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!docId) {
      return toast.error("Generate QR first before uploading.");
    }

    if (!selectedFile) return toast.error("Please select a PDF file");

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/document/upload/${docId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("PDF Uploaded Successfully!");

      setDocTitle("");
      setSelectedFile(null);
      setQrPreview(null);
      setDocId(null);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* sidebar  */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-800">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Admin Panel
          </h1>
        </header>

        {/* QR + Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
          {/* Generate QR */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">
              Generate New QR
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Document Title"
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />

              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
              >
                {qrLoading ? "Generating..." : "Generate QR"}
              </button>

              {qrPreview && (
                <div className="mt-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center">
                  <img
                    src={qrPreview}
                    alt="QR"
                    className="w-32 h-32 sm:w-40 sm:h-40 mb-3"
                  />
                  <a
                    href={qrPreview}
                    download={`${docTitle}-QR.png`}
                    className="text-blue-600 underline"
                  >
                    Download QR
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Upload PDF */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">
              Upload PDF
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-blue-500">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  id="pdf-upload"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />

                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <p className="text-gray-600">
                    {selectedFile ? selectedFile.name : "Select PDF"}
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
