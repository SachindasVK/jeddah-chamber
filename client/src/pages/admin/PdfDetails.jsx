import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-hot-toast';

const PdfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    const fetchDocDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/document/details/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        console.log(res.data);        
      console.log(res.data.pdfPath);  
        setDoc(res.data);
      } catch (err) {
        toast.error("Could not fetch document details");
        navigate('/admin/pdf-list');
      } finally {
        setLoading(false);
      }
    };
    fetchDocDetails();
  }, [id, adminToken, navigate]);

  if (loading) return <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white text-center p-4">Loading Viewer...</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Added overflow-x-hidden to prevent horizontal scroll on mobile */}
      <div className="flex-1 p-4 md:p-8 bg-gray-800 flex flex-col items-center overflow-x-hidden">
        
        {/* Header Controls: Switched to flex-col on small screens */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl md:text-2xl font-bold text-white break-words">{doc?.title}</h1>
            <p className="text-gray-400 text-sm">Created: {new Date(doc?.createdAt).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-600 transition whitespace-nowrap"
          >
            Back to List
          </button>
        </div>

        {/* Dynamic A4 Paper Container: Adjusted widths for better mobile fit */}
        <div className="w-full sm:w-[95%] md:w-[85%] lg:w-[85%] max-w-[1000px] bg-white shadow-2xl mb-10 overflow-hidden relative mx-auto" 
             style={{ 
               aspectRatio: '1 / 1.414',
               maxHeight: '100vh' 
             }}>
          
          {doc?.pdfPath ? (
            <object
              data={`${doc.pdfPath}#view=FitH`}
              type="application/pdf"
              className="w-full h-full border-none shadow-inner"
            >
              <iframe
                src={`${doc.pdfPath}#view=FitH`}
                title={doc.title}
                className="w-full h-full border-none shadow-inner"
              >
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                  <p className="mb-4">PDF preview not available in this browser.</p>
                  <a 
                    href={doc.pdfPath} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
                  >
                    View Document
                  </a>
                </div>
              </iframe>
            </object>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <div className="mb-4 text-4xl md:text-5xl">📄</div>
              <p className="text-base md:text-lg font-semibold mb-2">No PDF Uploaded</p>
              <p className="text-xs md:text-sm">Please upload a document to see the preview.</p>
            </div>
          )}
        </div>

        {/* Quick Info Bar: Flex-col on mobile, flex-row on larger screens */}
        <div className="w-full max-w-4xl bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 text-white text-sm">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-center sm:text-left">
            <span><strong>ID:</strong> <span className="break-all">{doc?.uniqueId}</span></span>
            <span><strong>Status:</strong> {doc?.pdfPath ? 'Verified' : 'Pending'}</span>
          </div>
          <a 
            href={doc?.pdfPath} 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-400 underline hover:text-blue-300 transition"
          >
            Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
};

export default PdfDetails;