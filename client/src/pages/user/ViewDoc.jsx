import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ViewDoc = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch document details using your laptop's IP
        const res = await axios.get(`http://192.168.43.89:5000/api/document/public/view/${id}`);
        setDoc(res.data);
      } catch (err) {
        console.error("Verification failed");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="text-center p-10">Verifying...</div>;
  if (!doc) return <div className="text-center p-10 text-red-500">Document Not Found</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header with Details */}
      <div className="p-4 bg-slate-800 shadow-md">
        <h1 className="text-lg font-bold text-green-400">✅ Verified: {doc.title}</h1>
        <p className="text-xs text-gray-400">Issued: {new Date(doc.date).toLocaleDateString()}</p>
      </div>

      {/* The PDF Viewer Section */}
      <div className="flex-1 w-full bg-white">
        {doc.pdfUrl ? (
          <iframe
            src={`${doc.pdfUrl}#view=FitH`} 
            title="Document View"
            className="w-full h-full border-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-black">
            <p>PDF is being generated. Please check back later.</p>
          </div>
        )}
      </div>
      
      {/* Footer Button for mobile download */}
      <div className="p-4">
        <a 
          href={doc.pdfUrl} 
          download 
          className="block w-full bg-blue-600 py-3 text-center rounded-lg font-bold"
        >
          Download Original Copy
        </a>
      </div>
    </div>
  );
};

export default ViewDoc