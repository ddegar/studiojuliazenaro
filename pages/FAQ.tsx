
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FAQ as FAQType } from '../types';

const FAQ: React.FC = () => {
   const navigate = useNavigate();
   const [openId, setOpenId] = useState<string | null>(null);
   const [faqs, setFaqs] = useState<FAQType[]>([]);
   const [categories, setCategories] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [whatsapp, setWhatsapp] = useState('5514999999999');

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [faqsRes, catRes, configRes] = await Promise.all([
               supabase.from('faqs').select('*').eq('active', true).order('display_order'),
               supabase.from('faq_categories').select('*').order('display_order'),
               supabase.from('studio_config').select('value').eq('key', 'whatsapp_central').single()
            ]);

            if (faqsRes.data) setFaqs(faqsRes.data);
            if (catRes.data) setCategories(catRes.data);
            if (configRes.data) setWhatsapp(configRes.data.value);
         } catch (error) {
            console.error(error);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const handleWhatsApp = () => {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Olá! Tenho uma dúvida sobre o estúdio.`, '_blank');
   };

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-4 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Dúvidas Frequentes</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
            {loading ? (
               <div className="text-center py-20 space-y-3">
                  <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-gray-400 font-medium">Buscando informações...</p>
               </div>
            ) : categories.map(cat => {
               const catFaqs = faqs.filter(f => f.category === cat.name);
               if (catFaqs.length === 0) return null;

               return (
                  <section key={cat.id} className="space-y-4">
                     <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-2">{cat.name}</h3>
                     <div className="space-y-3">
                        {catFaqs.map(item => (
                           <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300">
                              <button
                                 onClick={() => setOpenId(openId === item.id ? null : item.id)}
                                 className="w-full p-5 flex items-center justify-between text-left"
                              >
                                 <span className="font-bold text-sm text-primary pr-4">{item.question}</span>
                                 <span className={`material-symbols-outlined transition-transform text-gray-400 ${openId === item.id ? 'rotate-180' : ''}`}>expand_more</span>
                              </button>
                              {openId === item.id && (
                                 <div className="px-5 pb-5 animate-slide-down">
                                    <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-4">{item.answer}</p>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </section>
               );
            })}

            {!loading && faqs.length === 0 && (
               <div className="text-center py-20 px-10 space-y-4">
                  <span className="material-symbols-outlined !text-5xl text-gray-200">help_center</span>
                  <p className="text-xs text-gray-400 italic">Nenhuma dúvida cadastrada no momento.</p>
               </div>
            )}

            <div className="pt-8 text-center space-y-4">
               <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Ainda tem dúvidas?</p>
               <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-full font-bold text-xs mx-auto shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
               >
                  <span className="material-symbols-outlined !text-lg">chat_bubble</span> FALAR NO WHATSAPP
               </button>
            </div>
         </main>
      </div>
   );
};

export default FAQ;
