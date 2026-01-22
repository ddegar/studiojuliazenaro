
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TESTIMONIALS = [
   { id: 1, name: 'Alice Rocha', text: 'O Lash Lifting da Julia mudou minha rotina. Acordo pronta todos os dias! O atendimento é impecável e o ambiente super relaxante.', date: 'Há 2 dias', stars: 5 },
   { id: 2, name: 'Camila Bento', text: 'Melhor estúdio de Campinas. A técnica clássica ficou super natural, exatamente como eu queria. Recomendo de olhos fechados!', date: 'Há 1 semana', stars: 5 },
   { id: 3, name: 'Beatriz Santos', text: 'Profissionalismo define. A Julia explica cada passo e nos deixa super confortáveis. Meus cílios nunca estiveram tão lindos.', date: 'Há 2 semanas', stars: 5 },
];

const Testimonials: React.FC = () => {
   const navigate = useNavigate();
   const [testimonials, setTestimonials] = React.useState<any[]>([]);
   const [loading, setLoading] = React.useState(true);

   React.useEffect(() => {
      fetchTestimonials();
   }, []);

   const fetchTestimonials = async () => {
      try {
         setLoading(true);
         const { data, error } = await supabase
            .from('testimonials')
            .select('*, profiles(name)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

         if (error) throw error;
         setTestimonials(data || []);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Hoje';
      if (days < 7) return `Há ${days} dias`;
      if (days < 30) return `Há ${Math.floor(days / 7)} semanas`;
      return `Há ${Math.floor(days / 30)} meses`;
   };

   return (
      <div className="flex flex-col h-full bg-[#f8f7f4]">
         <header className="glass-nav p-4 flex items-center justify-between border-b sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-medium text-lg">Depoimentos</h2>
            <button onClick={() => navigate('/evaluation')} className="text-[#2D5043] text-xs font-black uppercase tracking-widest">Avaliar</button>
         </header>

         <main className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar">
            <div className="text-center space-y-4 pt-4">
               <h1 className="text-4xl font-display font-medium text-[#1a1c1a] leading-tight">O que dizem<br />sobre nós</h1>
               <p className="text-sm text-[#1a1c1a]/40 leading-relaxed italic max-w-[240px] mx-auto">A satisfação das nossas clientes é a nossa maior recompensa.</p>
            </div>

            {loading ? (
               <div className="flex justify-center py-10">
                  <div className="size-8 border-2 border-[#2D5043] border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : testimonials.length === 0 ? (
               <div className="text-center py-20 opacity-20 italic">
                  <span className="material-symbols-outlined text-4xl mb-2">format_quote</span>
                  <p className="text-sm">Seja a primeira a avaliar! ✨</p>
               </div>
            ) : (
               <div className="space-y-6">
                  {testimonials.map(item => (
                     <div key={item.id} className="bg-white p-6 rounded-[32px] border border-[#1a1c1a]/5 shadow-sm space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                           <div className="flex gap-1 text-[#C5A059]">
                              {[...Array(item.rating)].map((_, i) => (
                                 <span key={i} className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              ))}
                           </div>
                           <span className="text-[9px] text-[#1a1c1a]/30 font-black uppercase tracking-widest">{formatTime(item.created_at)}</span>
                        </div>

                        {item.photo_url && (
                           <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                              <img src={item.photo_url} alt="Testimonial" className="w-full h-full object-cover" />
                           </div>
                        )}

                        <p className="text-sm text-[#1a1c1a]/70 leading-relaxed italic font-medium">"{item.message}"</p>

                        <div className="flex items-center gap-3 pt-4 border-t border-[#1a1c1a]/5">
                           <div className="size-8 rounded-full bg-[#2D5043]/5 flex items-center justify-center text-[#2D5043] text-[10px] font-black border border-[#2D5043]/10">
                              {item.profiles?.name?.[0] || 'U'}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1c1a]">{item.profiles?.name || 'Cliente Secreta'}</span>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            <div className="bg-primary/5 p-8 rounded-[40px] text-center space-y-4">
               <p className="text-sm font-bold text-primary">Quer aparecer aqui?</p>
               <button
                  onClick={() => navigate('/evaluation')}
                  className="px-8 py-3 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
               >
                  DEIXAR MEU FEEDBACK
               </button>
            </div>
         </main>
      </div>
   );
};

export default Testimonials;
