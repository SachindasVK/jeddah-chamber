import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


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
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Arabic Form States
  const [docNumber, setDocNumber] = useState("");
  const [unifiedNumber, setUnifiedNumber] = useState("");
  const [creationDate, setCreationDate] = useState(null);
  const [docStatus, setDocStatus] = useState("");
  const [establishmentName, setEstablishmentName] = useState("");
  const [subscriptionNumber, setSubscriptionNumber] = useState("");
  const [requestSubmitter, setRequestSubmitter] = useState("");

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
    }
  }, [adminToken, navigate]);

  if (!adminToken) {
    return null;
  }

  const handleSaveDetails = (e) => {
    e.preventDefault();
    setDetailsSaved(true);
    toast.success("Document details saved successfully");
  };

  // Generate QR
  const handleGenerateQR = async () => {
    if (!docTitle.trim()) return toast.error("Please enter a document title");

    setQrLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/document/generate`,
        {
  title: docTitle.trim(),
  docNumber,
  unifiedNumber,
  creationDate,
  docStatus,
  establishmentName,
  subscriptionNumber,
  requestSubmitter,
},
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
          toast.error(
            err.response.data.message || "Document title already exists",
          );
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
        `${import.meta.env.VITE_API_URL}/api/document/upload/${docId}`,
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

      {/* Arabic Document Form */}
<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border mb-8">
  <h2 className="text-lg sm:text-xl font-bold mb-6 text-gray-700">
    معلومات الوثيقة
  </h2>

  <form onSubmit={handleSaveDetails} className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* رقم الوثيقة */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        رقم الوثيقة
      </label>

      <input
        type="text"
        value={docNumber}
        onChange={(e) => setDocNumber(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="أدخل رقم الوثيقة"
      />
    </div>

    {/* الرقم الموحد */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        الرقم الموحد
      </label>

      <input
        type="text"
        value={unifiedNumber}
        onChange={(e) => setUnifiedNumber(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="أدخل الرقم الموحد"
      />
    </div>


    {/* حالة الوثيقة */}
   <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    حالة الوثيقة
  </label>

  <input
    type="text"
    value={docStatus}
    onChange={(e) => setDocStatus(e.target.value)}
    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="أدخل حالة الوثيقة"
  />
</div>

    {/* اسم المنشأة */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        اسم المنشأة
      </label>

      <input
        type="text"
        value={establishmentName}
        onChange={(e) => setEstablishmentName(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="أدخل اسم المنشأة"
      />
    </div>

    {/* رقم الإشتراك */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        رقم الإشتراك
      </label>

      <input
        type="text"
        value={subscriptionNumber}
        onChange={(e) => setSubscriptionNumber(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="أدخل رقم الإشتراك"
      />
    </div>

    {/* مقدم الطلب */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        مقدم الطلب
      </label>

      <input
        type="text"
        value={requestSubmitter}
        onChange={(e) => setRequestSubmitter(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="أدخل اسم مقدم الطلب"
      />
    </div>

     {/* تاريخ الإنشاء */}
   <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    تاريخ الإنشاء
  </label>

 <DatePicker
  selected={creationDate}
  onChange={(date) => setCreationDate(date)}
  dateFormat="MMM/dd/yyyy"
  placeholderText="MM/DD/YYYY"
  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
/>
</div>

    <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 mt-4">
      <span className="text-sm text-gray-500">
        {detailsSaved ? "Details saved. You can now generate the QR." : "Fill the details and press Submit."}
      </span>
      <button
        type="submit"
        className="w-full sm:w-auto bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700"
      >
        Submit Details
      </button>
    </div>
  </form>
</div>
      

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
                disabled={qrLoading}
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
              <div className="border-2 border-dashed rounded-lg p-3 sm:p-3 text-center hover:border-blue-500">
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
