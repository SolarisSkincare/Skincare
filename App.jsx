import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { Search, Plus, ChevronRight, Activity, Sparkles, Clock, Star, Trash2, X, Stethoscope, Pill, Sun } from 'lucide-react';

// إعدادات Firebase
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'drshams-elite-cloud';

const App = () => {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // حالة المراجع الجديد
  const [formData, setFormData] = useState({
    name: '',
    issue: '',
    treatment: '',
    routine: '',
    improvement: 0,
    result: ''
  });

  // تسجيل الدخول
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // جلب البيانات من السحابة
  useEffect(() => {
    if (!user) return;
    const patientsRef = collection(db, 'artifacts', appId, 'public', 'data', 'patients');
    const unsubscribe = onSnapshot(query(patientsRef), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!formData.name || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'patients'), {
        ...formData,
        createdAt: Date.now(),
        dateStr: new Date().toLocaleDateString('ar-EG')
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', issue: '', treatment: '', routine: '', improvement: 0, result: '' });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا السجل؟")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patients', id));
    setSelectedPatient(null);
  };

  const filtered = patients.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FDFEFF] text-slate-800 font-['Cairo'] pb-24" dir="rtl">
      {/* Header الفاخر */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl p-6 border-b border-slate-100">
        <div className="max-w-xl mx-auto flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-rose-500 bg-clip-text text-transparent">DrShams</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Elite Cloud System</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-2xl shadow-inner">
            <Sparkles className="text-indigo-600 w-6 h-6" />
          </div>
        </div>
        
        <div className="max-w-xl mx-auto relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث عن مراجع..."
            className="w-full p-4 pr-12 rounded-2xl bg-slate-100/50 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </nav>

      {/* قائمة المراجعين */}
      <main className="max-w-xl mx-auto px-6 mt-8 space-y-4">
        {loading ? (
           <div className="flex justify-center py-20"><div className="animate-pulse text-indigo-500 font-bold italic">جاري تحميل البيانات...</div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 opacity-20 font-bold italic">لا توجد سجلات حالياً</div>
        ) : (
          filtered.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className="bg-white p-6 rounded-[2.5rem] flex justify-between items-center cursor-pointer shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black shadow-inner">
                  {p.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{p.name}</h3>
                  <p className="text-[10px] text-rose-500 font-black tracking-widest uppercase">{p.issue || 'عام'}</p>
                </div>
              </div>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black">
                {p.improvement}%
              </div>
            </div>
          ))
        )}
      </main>

      {/* زر الإضافة */}
      <div className="fixed bottom-10 left-0 right-0 px-8 z-40 pointer-events-none">
        <div className="max-w-xl mx-auto flex justify-center pointer-events-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white w-20 h-20 rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all"
          >
            <Plus strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* شاشة التفاصيل */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-bottom duration-500">
          <div className="max-w-xl mx-auto p-8 pb-32">
            <div className="flex justify-between items-center mb-10">
              <button onClick={() => setSelectedPatient(null)} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600"><ChevronRight /></button>
              <button onClick={() => handleDelete(selectedPatient.id)} className="text-rose-500 bg-rose-50 px-4 py-2 rounded-xl text-xs font-bold">حذف السجل</button>
            </div>

            <div className="mb-10">
              <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{selectedPatient.name}</h2>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <Clock className="w-3 h-3" /> <span>سجلت في {selectedPatient.dateStr}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* بطاقة التقدم */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-indigo-200 text-xs font-black uppercase mb-2 tracking-widest italic">Progress Overview</p>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-6xl font-black">{selectedPatient.improvement}%</span>
                    <Activity className="w-10 h-10 opacity-30" />
                  </div>
                  <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                    <div className="bg-white h-full transition-all duration-1000" style={{width: `${selectedPatient.improvement}%`}}></div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                <h4 className="text-indigo-600 font-black text-xs uppercase mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" /> المشكلة والتشخيص
                </h4>
                <p className="text-slate-700 font-bold leading-relaxed">{selectedPatient.issue}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                  <h4 className="text-slate-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2"><Pill className="w-3 h-3"/> العلاجات</h4>
                  <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{selectedPatient.treatment}</p>
                </div>
                <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                  <h4 className="text-slate-400 font-black text-[10px] uppercase mb-4 flex items-center gap-2"><Sun className="w-3 h-3"/> الروتين</h4>
                  <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{selectedPatient.routine}</p>
                </div>
              </div>

              <div className="p-8 bg-emerald-50 rounded-[3rem] border border-emerald-100">
                <h4 className="text-emerald-600 font-black text-xs uppercase mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" /> النتيجة النهائية
                </h4>
                <p className="text-emerald-900 font-bold italic text-lg leading-relaxed">"{selectedPatient.result || 'قيد الملاحظة...'}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال الإضافة */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">إضافة حالة جديدة</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X /></button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scroll">
              <input type="text" placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="التشخيص / المشكلة" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100" value={formData.issue} onChange={(e) => setFormData({...formData, issue: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <textarea placeholder="العلاجات" className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-28 focus:ring-4 focus:ring-indigo-100" value={formData.treatment} onChange={(e) => setFormData({...formData, treatment: e.target.value})} />
                <textarea placeholder="الروتين" className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-28 focus:ring-4 focus:ring-indigo-100" value={formData.routine} onChange={(e) => setFormData({...formData, routine: e.target.value})} />
              </div>

              <div className="bg-indigo-50 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-black text-indigo-600 uppercase tracking-widest">نسبة التحسن</label>
                  <span className="text-indigo-600 font-black">{formData.improvement}%</span>
                </div>
                <input type="range" min="0" max="100" className="w-full accent-indigo-600 h-2 bg-indigo-200 rounded-full appearance-none cursor-pointer" value={formData.improvement} onChange={(e) => setFormData({...formData, improvement: parseInt(e.target.value)})} />
              </div>

              <textarea placeholder="النتيجة والتحسن النهائي" className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-24 focus:ring-4 focus:ring-indigo-100" value={formData.result} onChange={(e) => setFormData({...formData, result: e.target.value})} />
            </div>

            <button onClick={handleSave} className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">حفظ البيانات في السحابة</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

