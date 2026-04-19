import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL;

const PdfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    const fetchDocDetails = async () => {
      try {
        const res = await axios.get(
          `${API}/api/document/details/${id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        setDoc(res.data);
      } catch (err) {
        toast.error("Could not fetch document details");
        navigate("/admin/pdf-list");
      } finally {
        setLoading(false);
      }
    };

    fetchDocDetails();
  }, [id, adminToken, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white">
        Loading Viewer...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-4 md:p-8 bg-gray-800 flex flex-col items-center">
        
        {/* HEADER */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {doc?.title}
            </h1>
            <p className="text-gray-400 text-sm">
              Created: {new Date(doc?.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        {/* PDF VIEWER */}
        <div
          className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden"
          style={{
            aspectRatio: "1 / 1.414",
            maxHeight: "100vh",
          }}
        >
          {doc?.pdfPath ? (
            <iframe
              src={`${doc.pdfPath}#view=FitH`}
              title={doc.title}
              className="w-full h-full border-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>No PDF Available</p>
            </div>
          )}
        </div>

        {/* INFO BAR */}
        <div className="w-full max-w-4xl bg-gray-700 p-4 rounded mt-6 text-white text-sm flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <p>
              <strong>ID:</strong> {doc?.uniqueId}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {doc?.pdfPath ? "Available" : "Pending"}
            </p>
          </div>

          {doc?.pdfPath && (
            <a
              href={doc.pdfPath}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline"
            >
              Open in New Tab
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfDetails;