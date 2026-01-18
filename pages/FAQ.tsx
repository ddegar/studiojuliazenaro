
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FAQ as FAQType } from '../types';

const FAQ: React.FC = () => {
   const navigate = useNavigate();
   const [openIndex, setOpenIndex] = useState<number | null>(0);
   const [faqs, setFaqs] = useState<FAQType[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchFaqs = async () => {
         const { data } = await supabase.from('faqs').select('*').eq('active', true).order('display_order');
         if (data) setFaqs(data);
         setLoading(false);
      };
      fetchFaqs();
   }, []);

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-4 flex items-center justify-between border-b">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Dúvidas Frequentes</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
            {loading ? <p className="text-center text-gray-500 py-10">Carregando...</p> : faqs.map((item, i) => (
               <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <button
                     onClick={() => setOpenIndex(openIndex === i ? null : i)}
                     className="w-full p-5 flex items-center justify-between text-left"
                  >
                     <span className="font-bold text-sm text-primary">{item.question}</span>
                     <span className={`material-symbols-outlined transition-transform text-gray-400 ${openIndex === i ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  {openIndex === i && (
                     <div className="px-5 pb-5 animate-slide-down">
                        <p className="text-xs text-gray-500 leading-relaxed border-t pt-4">{item.answer}</p>
                     </div>
                  )}
               </div>
            ))}
            {!loading && faqs.length === 0 && (
               <p className="text-center text-gray-400 text-sm">Nenhuma dúvida cadastrada no momento.</p>
            )}

            <div className="pt-8 text-center space-y-4">
               <p className="text-xs text-gray-400">Ainda tem dúvidas?</p>
               <button className="flex items-center gap-3 px-6 py-3 bg-[#25D366] text-white rounded-full font-bold text-xs mx-auto shadow-lg shadow-green-500/20">
                  <span className="material-symbols-outlined !text-lg">chat_bubble</span> FALAR NO WHATSAPP
               </button>
            </div>
         </main>
      </div>
   );
};

export default FAQ;
