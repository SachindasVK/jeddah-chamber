import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ViewDoc = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Dynamic IP - ensures your phone can reach the Lubuntu server
        const res = await axios.get(`http://192.168.43.89:5000/api/document/public/view/${id}`);
        setDoc(res.data);
      } catch (err) {
        toast.error("Verification failed");
      } 
    };
    fetchDetails();
  }, [id]);
  if (!doc) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Document</h2>
        <p className="text-gray-500">The QR code scanned does not match any record.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col items-center sm:py-8 sm:px-6">
      
      {/* Responsive Header Container */}
      <div className="w-full max-w-[850px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <h1>Hel</h1>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-800 leading-tight">
              {doc.title}
            </h1>
            <p className="text-xs sm:text-sm text-blue-600 font-semibold uppercase tracking-wider">
              Official Verification Portal
            </p>
          </div>
        </div>
        
        <a 
          href={doc.pdfUrl} 
          download 
          className="w-full sm:w-auto bg-[#0056b3] text-white text-center px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-800 transition-all font-bold text-sm"
        >
          Download Copy
        </a>
      </div>

      {/* Dynamic A4 Container */}
      {/* w-[98%]  -> Almost full width on tiny phones 
          sm:w-[90%] -> A bit of margin on tablets
          max-w-[850px] -> Stops growing on desktops
      */}
      <div 
        className="w-[98%] sm:w-[92%] max-w-[850px] bg-white shadow-2xl overflow-hidden border border-gray-200 relative"
        style={{ 
          aspectRatio: '1 / 1.414', 
          maxHeight: '80vh' 
        }}
      >
        {doc.pdfUrl ? (
          <object
            data={`${doc.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            type="application/pdf"
            className="w-full h-full border-none"
          >
            <iframe
              src={`${doc.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
              title="Document View"
              className="w-full h-full border-none"
              loading="lazy"
            >
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                <p className="mb-4 text-sm">PDF preview not available in this browser.</p>
                <a 
                  href={doc.pdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm"
                >
                  View Document
                </a>
              </div>
            </iframe>
          </object>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10">
             <span className="text-4xl mb-4">⌛</span>
             <p className="font-medium">Document content is processing...</p>
          </div>
        )}
      </div>

      {/* Responsive Footer Details */}
      <div className="w-full max-w-[850px] mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
        <div className="text-left">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Verification ID</p>
          <p className="text-xs text-gray-600 truncate">{id}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Verification Date</p>
          <p className="text-xs text-gray-600">{new Date(doc.date).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-10 mb-6 text-center">
        <p className="text-gray-400 text-[10px] italic">
          This is a computer-generated document and does not require a physical signature.
        </p>
      </div>
    </div>
  );
};

export default ViewDoc;