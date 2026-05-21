import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL;

const PdfList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const adminToken = localStorage.getItem("adminToken");

  const navigate = useNavigate()

  // Fetch Documents with Pagination
  const fetchDocs = React.useCallback(async (currentPage) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/document/all?page=${currentPage}&limit=15`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      // Backend should return { documents, totalPages, currentPage }
      setDocuments(res.data.documents);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocs(page);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, fetchDocs]);

  // Delete Logic

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This PDF record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API}/api/document/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      toast.success("PDF deleted successfully");

      const isLastItem = documents.length === 1;

      if (isLastItem && page > 1) {
        const newPage = page - 1;
        setPage(newPage);
        fetchDocs(newPage);
      } else {
        fetchDocs(page);
      }
    } catch (err) {
      console.error("Failed to delete PDF:", err);
      toast.error("Failed to delete PDF");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-4 sm:p-8 bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Documents</h1>
          <span className="text-gray-400 text-sm">
            Total Pages: {totalPages}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-gray-700 font-semibold">#</th>
                  <th className="p-4 text-gray-700 font-semibold">Title</th>
                  <th className="p-4 text-gray-700 font-semibold">Doc #</th>
                  <th className="p-4 text-gray-700 font-semibold">Unified #</th>
                  <th className="p-4 text-gray-700 font-semibold">Creation Date</th>
                  <th className="p-4 text-gray-700 font-semibold">Status</th>
                  <th className="p-4 text-gray-700 font-semibold">Establishment</th>
                  <th className="p-4 text-gray-700 font-semibold">Subscription #</th>
                  <th className="p-4 text-gray-700 font-semibold">Submitter</th>
                  <th className="p-4 text-gray-700 font-semibold">PDF</th>
                  <th className="p-4 text-gray-700 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="p-10 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                        Loading documents...
                      </div>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-10 text-center text-gray-500">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, index) => (
                    <tr
                      key={doc._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                          <td className="p-4 text-gray-500 text-sm">
                        {(page - 1) * 15 + index + 1}
                      </td>
                      <td className="p-4 font-medium text-gray-800">{doc.title}</td>
                      <td className="p-4 text-gray-600 text-sm">{doc.docNumber || "-"}</td>
                      <td className="p-4 text-gray-600 text-sm">{doc.unifiedNumber || "-"}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        {doc.creationDate
                          ? new Date(doc.creationDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {doc.docStatus ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {doc.docStatus}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            Unknown
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {doc.establishmentName || "-"}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {doc.subscriptionNumber || "-"}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {doc.requestSubmitter || "-"}
                      </td>
                      <td className="p-4 text-gray-600 text-sm break-words">
                        {doc.pdfPath ? (
                          <a
                            href={doc.pdfPath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          <span className="text-orange-700">Pending</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-4">
                          {doc.pdfPath && (
                            <button
                              onClick={() =>
                                navigate(`/admin/document/${doc._id}`)
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                            >
                              View
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc._id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-gray-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-50 hover:bg-gray-100 transition text-sm font-medium"
            >
              Previous
            </button>

            <span className="text-sm font-semibold text-gray-600 bg-white px-4 py-1 rounded-full border">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-50 hover:bg-gray-100 transition text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfList;
