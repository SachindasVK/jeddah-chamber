import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');

  // Form States
  const [docId, setDocId] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!adminToken) {
    navigate('/admin/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Generate QR
  const handleGenerateQR = async () => {
    if (!docTitle) return alert("Please enter a document title");

    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/document/generate',
        { title: docTitle },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      setQrPreview(res.data.qrCodeImage);

      if (res.data.document && res.data.document._id) {
        setDocId(res.data.document._id);
        alert("QR Generated Successfully! Step 1 complete.");
      }
    } catch (err) {
      alert("Error generating QR. Check if server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Upload PDF
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!docId) {
      return alert("Generate QR first before uploading.");
    }

    if (!selectedFile) return alert("Please select a PDF file");

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/document/upload/${docId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert("PDF Uploaded Successfully!");

      setDocTitle('');
      setSelectedFile(null);
      setQrPreview(null);
      setDocId(null);

    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-full lg:w-64 bg-gray-900 text-white p-4 lg:p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 lg:mb-10 text-blue-400">QR Manager</h2>

        <nav className="space-y-3 lg:space-y-4">
          <div className="p-3 bg-slate-800 rounded-lg cursor-pointer">
            Dashboard
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left p-3 hover:bg-red-900/50 text-red-400 rounded-lg mt-6 lg:mt-10 transition-colors"
          >
            Logout
          </button>
        </nav>
      </div>

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
                {loading ? "Generating..." : "Generate QR"}
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-xl shadow border-b-4 border-blue-500">
            <p className="text-gray-500">Total Scans</p>
            <h3 className="text-3xl sm:text-4xl font-bold">1,284</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border-b-4 border-purple-500">
            <p className="text-gray-500">Active QRs</p>
            <h3 className="text-3xl sm:text-4xl font-bold">42</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border-b-4 border-orange-500">
            <p className="text-gray-500">Downloads</p>
            <h3 className="text-3xl sm:text-4xl font-bold">12</h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;