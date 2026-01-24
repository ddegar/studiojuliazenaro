
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
      <div className="flex flex-col h-full bg-background-light overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-blur px-6 py-5 flex justify-between items-center border-b border-primary/5">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white border border-primary/5 text-primary shadow-sm active:scale-90 transition-transform">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Suporte Exclusivo</p>
                  <h2 className="text-xl font-display italic text-primary tracking-tight">Dúvidas Frequentes</h2>
               </div>
            </div>
            <span className="size-10"></span>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-10 pb-32">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="relative size-12 flex items-center justify-center">
                     <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
                     <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[10px] font-outfit font-bold text-primary/40 uppercase tracking-widest">Sincronizando Respostas</p>
               </div>
            ) : categories.map((cat, idx) => {
               const catFaqs = faqs.filter(f => f.category === cat.name);
               if (catFaqs.length === 0) return null;

               return (
                  <section key={cat.id} className="space-y-6 animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                     <div className="flex items-center gap-3 px-2">
                        <span className="h-px w-6 bg-accent-gold/40"></span>
                        <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] font-outfit">{cat.name}</h3>
                     </div>
                     <div className="grid gap-4">
                        {catFaqs.map(item => (
                           <div
                              key={item.id}
                              className={`group overflow-hidden rounded-[32px] border transition-all duration-500 ${openId === item.id ? 'bg-white border-accent-gold/20 shadow-xl' : 'bg-white/40 border-primary/5 hover:border-accent-gold/30'}`}
                           >
                              <button
                                 onClick={() => setOpenId(openId === item.id ? null : item.id)}
                                 className="w-full p-6 flex items-center justify-between text-left"
                              >
                                 <span className={`font-outfit font-bold text-sm transition-colors duration-300 ${openId === item.id ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`}>{item.question}</span>
                                 <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${openId === item.id ? 'bg-primary text-white rotate-180' : 'bg-primary/5 text-primary'}`}>
                                    <span className="material-symbols-outlined !text-lg">expand_more</span>
                                 </div>
                              </button>
                              <div className={`grid transition-all duration-500 ease-in-out ${openId === item.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                 <div className="overflow-hidden">
                                    <div className="px-6 pb-6 pt-2">
                                       <div className="h-px w-8 bg-accent-gold/20 mb-4"></div>
                                       <p className="text-xs text-primary/60 leading-relaxed font-outfit font-light italic">
                                          {item.answer}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>
               );
            })}

            {!loading && faqs.length === 0 && (
               <div className="text-center py-24 px-10 space-y-6 opacity-30">
                  <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                     <span className="material-symbols-outlined !text-4xl text-primary">spa</span>
                  </div>
                  <p className="text-xs font-outfit text-primary italic tracking-wide">Uma jornada de conhecimento sem precedentes está sendo preparada.</p>
               </div>
            )}

            <div className="pt-12 text-center space-y-6 animate-reveal" style={{ animationDelay: '0.4s' }}>
               <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] text-primary/30 uppercase font-black tracking-[0.4em]">Personal Concierge</p>
                  <h4 className="text-xl font-display text-primary">Ainda tem dúvidas?</h4>
               </div>
               <button
                  onClick={handleWhatsApp}
                  className="group relative flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-full font-outfit font-black text-[10px] uppercase tracking-[0.3em] mx-auto shadow-2xl shadow-primary/20 overflow-hidden active:scale-95 transition-all"
               >
                  <div className="absolute inset-0 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <span className="material-symbols-outlined !text-lg relative z-10 group-hover:text-primary transition-colors">chat_bubble</span>
                  <span className="relative z-10 group-hover:text-primary transition-colors">Falar no WhatsApp</span>
               </button>
            </div>
         </main>
         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
      </div>
   );
};

export default FAQ;
