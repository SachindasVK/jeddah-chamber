import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { Search, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

const API = import.meta.env.VITE_API_URL;

const PdfList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [search, setSearch] = useState("");
  const adminToken = localStorage.getItem("adminToken");

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDocNumber, setEditDocNumber] = useState("");
  const [editUnifiedNumber, setEditUnifiedNumber] = useState("");
  const [editCreationDate, setEditCreationDate] = useState(null);
  const [editDocStatus, setEditDocStatus] = useState("");
  const [editEstablishmentName, setEditEstablishmentName] = useState("");
  const [editSubscriptionNumber, setEditSubscriptionNumber] = useState("");
  const [editRequestSubmitter, setEditRequestSubmitter] = useState("");
  const [editCommercialRegisterNumber, setEditCommercialRegisterNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate()

  // Fetch Documents with Pagination
  const fetchDocs = React.useCallback(async (currentPage, searchTerm = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 15 });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await axios.get(`${API}/api/document/all?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      // Backend should return { documents, totalPages, currentPage }
      setDocuments(res.data.documents);
      setTotalDocuments(res.data.totalDocuments);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [adminToken, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDocs(page), 300);
    return () => clearTimeout(timer);
  }, [page, search, fetchDocs]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

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

  const openEditModal = (doc) => {
    setEditDocId(doc._id);
    setEditTitle(doc.title || "");
    setEditDocNumber(doc.docNumber || "");
    setEditUnifiedNumber(doc.unifiedNumber || "");
    setEditCreationDate(doc.creationDate ? new Date(doc.creationDate) : null);
    setEditDocStatus(doc.docStatus || "");
    setEditEstablishmentName(doc.establishmentName || "");
    setEditSubscriptionNumber(doc.subscriptionNumber || "");
    setEditRequestSubmitter(doc.requestSubmitter || "");
    setEditCommercialRegisterNumber(doc.commercialRegisterNumber || "");
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return toast.error("Please enter a document title");

    setIsUpdating(true);
    try {
      await axios.put(
        `${API}/api/document/${editDocId}`,
        {
          title: editTitle.trim(),
          docNumber: editDocNumber,
          unifiedNumber: editUnifiedNumber,
          creationDate: editCreationDate,
          docStatus: editDocStatus,
          establishmentName: editEstablishmentName,
          subscriptionNumber: editSubscriptionNumber,
          requestSubmitter: editRequestSubmitter,
          commercialRegisterNumber: editCommercialRegisterNumber,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      toast.success("Document updated successfully");
      setIsEditModalOpen(false);
      fetchDocs(page);
    } catch (err) {
      console.error("Failed to update document:", err);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to update document");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-4 sm:p-8 bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Documents</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-300">
              Total PDF Documents: <strong className="text-white">{totalDocuments}</strong>
            </span>
            <span className="text-gray-400">Pages: {totalPages}</span>
          </div>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search
            size={20}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search documents, numbers, establishments..."
            aria-label="Search documents"
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-10 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear document search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-gray-700 font-semibold">#</th>
                  <th className="p-4 text-gray-700 font-semibold">Title</th>
                  <th className="p-4 text-gray-700 font-semibold">Doc</th>
                  <th className="p-4 text-gray-700 font-semibold">Unified</th>
                  <th className="p-4 text-gray-700 font-semibold">Creation Date</th>
                  <th className="p-4 text-gray-700 font-semibold">Register Number</th>
                  <th className="p-4 text-gray-700 font-semibold">Establishment</th>
                  <th className="p-4 text-gray-700 font-semibold">Subscription</th>
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
                        {doc.commercialRegisterNumber ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {doc.commercialRegisterNumber}
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
                            Download
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
                            onClick={() => openEditModal(doc)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition"
                          >
                            Edit
                          </button>
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
      
      {/* Edit Document Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 transform transition-all">
            {/* Modal Header */}
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center border-b border-gray-700">
              <h3 className="text-xl font-bold">تعديل الوثيقة (Edit Document)</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateSubmit} className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Document Title (العنوان)
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="Document Title"
                  />
                </div>

                {/* رقم الوثيقة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    رقم الوثيقة (Document Number)
                  </label>
                  <input
                    type="text"
                    value={editDocNumber}
                    onChange={(e) => setEditDocNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="رقم الوثيقة"
                  />
                </div>

                {/* الرقم الموحد */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    الرقم الموحد (Unified Number)
                  </label>
                  <input
                    type="text"
                    value={editUnifiedNumber}
                    onChange={(e) => setEditUnifiedNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="الرقم الموحد"
                  />
                </div>

                {/* حالة الوثيقة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    حالة الوثيقة (Document Status)
                  </label>
                  <select
                    value={editDocStatus}
                    onChange={(e) => setEditDocStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  >
                    <option value="">اختر الحالة (Select Status)</option>
                    <option value="active">Active (ساري)</option>
                    <option value="inactive">Inactive (غير نشط)</option>
                    <option value="archived">Archived (مؤرشف)</option>
                  </select>
                </div>

                {/* اسم المنشأة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    اسم المنشأة (Establishment Name)
                  </label>
                  <input
                    type="text"
                    value={editEstablishmentName}
                    onChange={(e) => setEditEstablishmentName(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="اسم المنشأة"
                  />
                </div>

                {/* رقم الإشتراك */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    رقم الإشتراك (Subscription Number)
                  </label>
                  <input
                    type="text"
                    value={editSubscriptionNumber}
                    onChange={(e) => setEditSubscriptionNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="رقم الإشتراك"
                  />
                </div>

                {/* مقدم الطلب */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    مقدم الطلب (Request Submitter)
                  </label>
                  <input
                    type="text"
                    value={editRequestSubmitter}
                    onChange={(e) => setEditRequestSubmitter(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="اسم مقدم الطلب"
                  />
                </div>

                {/* رقم السجل التجاري */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    رقم السجل التجاري (Commercial Register Number)
                  </label>
                  <input
                    type="text"
                    value={editCommercialRegisterNumber}
                    onChange={(e) => setEditCommercialRegisterNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 text-right rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="رقم السجل التجاري"
                  />
                </div>

                {/* تاريخ الإنشاء */}
                <div className="flex flex-col">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-right">
                    تاريخ الإنشاء (Creation Date)
                  </label>
                  <DatePicker
                    selected={editCreationDate}
                    onChange={(date) => setEditCreationDate(date)}
                    dateFormat="MMM/dd/yyyy"
                    placeholderText="MM/DD/YYYY"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition cursor-pointer"
                >
                  Cancel (إلغاء)
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isUpdating && <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>}
                  Save Changes (حفظ)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfList;
