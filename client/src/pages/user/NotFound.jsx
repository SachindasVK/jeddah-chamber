import { Satellite } from 'lucide-react'; // Using a satellite icon to match your image
import toast from 'react-hot-toast';

const NotFound = () => {
  const handleClick = () => {
    toast.error('something went wrong!');
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      {/* Satellite Illustration Circle */}
      <div className="w-64 h-64 bg-slate-100 rounded-full flex items-center justify-center mb-8 relative">
        {/* Subtle star/dot decorations */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="absolute bottom-12 right-16 w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="absolute top-20 right-10 w-2 h-2 bg-gray-300 rounded-full"></div>
        
        <Satellite size={120} className="text-slate-500 stroke-[1px]" />
      </div>

      {/* Text Content */}
      <h1 className="text-2xl font-bold text-[#002b5c] mb-4">Error 404</h1>
      
      <p className="text-lg text-[#006699] text-center mb-10 max-w-md leading-relaxed" dir="rtl">
        عذراً ، الصفحة التي كنت تحاول عرضها غير موجودة.
      </p>

      {/* Custom Gradient Button */}
      <button 
        onClick={() => handleClick()}
        className="bg-gradient-to-r from-[#49c5cf] to-[#005c8a] text-white font-bold py-3 px-12 rounded-full shadow-lg hover:opacity-90 transition-all text-lg"
        dir="rtl"
      >
        العودة الى الصفحة الرئيسية
      </button>
    </div>
  );
};

export default NotFound;