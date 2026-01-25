import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const CheckInShare: React.FC = () => {
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [pointsEarned, setPointsEarned] = useState<{ amount: number, type: 'INSTAGRAM' | 'APP' } | null>(null);

    const processRewards = async (actionCode: string, description: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: rule } = await supabase
            .from('loyalty_actions')
            .select('points_reward, is_active')
            .eq('code', actionCode)
            .single();

        if (!rule || !rule.is_active) return;

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentTx } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('user_id', user.id)
            .in('source', ['STORY_INSTA', 'STORY_STUDIO', 'STORY_SHARE', 'APP_STORY_SHARE'])
            .gt('created_at', twentyFourHoursAgo)
            .limit(1);

        if (recentTx && recentTx.length > 0) return;

        const amount = rule.points_reward;
        await supabase.from('point_transactions').insert({
            user_id: user.id,
            amount: amount,
            source: actionCode,
            description: description
        });

        await supabase.rpc('increment_lash_points', {
            user_id_param: user.id,
            amount_param: amount
        });

        setPointsEarned({ amount, type: actionCode === 'STORY_INSTA' ? 'INSTAGRAM' : 'APP' });
    };

    const handleInstagramShare = async () => {
        await processRewards('STORY_INSTA', 'Compartilhamento Instagram (Check-in)');
        setTimeout(() => {
            window.open('instagram://story-camera', '_blank');
        }, 300);
    };

    const handleAppShare = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Upload Image
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('stories')
                .getPublicUrl(fileName);

            // 3. Insert into Stories Table
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const { error: dbError } = await supabase
                .from('stories')
                .insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    expires_at: expiresAt,
                    type: 'image'
                });

            if (dbError) throw dbError;

            // 4. Award Points
            await processRewards('STORY_STUDIO', 'Storie no App (Check-in)');

            setTimeout(() => {
                alert('Seu momento foi compartilhado no App JZ Privé e ficará visível por 24h! ✨');
                navigate('/stories');
            }, 1000);

        } catch (error: any) {
            console.error('Error sharing story:', error);
            alert('Erro ao compartilhar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary pb-32">
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
                        <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Social Club</p>
                        <h2 className="text-xl font-display italic text-primary tracking-tight">Compartilhar Brilho</h2>
                    </div>
                </div>
                <div className="size-10"></div>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-sm mx-auto p-8 space-y-12">

                {/* Elite Reward Card */}
                <div className="group relative bg-primary p-10 rounded-[48px] shadow-2xl shadow-primary/20 overflow-hidden animate-reveal">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:rotate-45 duration-700">
                        <span className="material-symbols-outlined !text-7xl text-accent-gold">auto_awesome</span>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-accent-gold border border-white/5">
                                <span className="material-symbols-outlined !text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                            </span>
                            <span className="text-[9px] font-outfit font-black uppercase tracking-[0.3em] text-white/60">Recompensa Exclusiva</span>
                        </div>

                        <h1 className="text-3xl font-display text-white leading-tight">
                            Sua beleza <br /><span className="italic text-accent-gold"> merece ser </span> vista.
                        </h1>

                        <p className="text-xs font-outfit text-white/40 leading-relaxed font-light italic">
                            Compartilhe seu momento JZ Studio e desbloqueie <span className="text-accent-gold font-bold">50 JZ Balance</span> para sua próxima experiência.
                        </p>
                    </div>
                </div>

                {/* Simulated Filter Preview */}
                <div className="w-full flex flex-col items-center animate-reveal" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <p className="text-[9px] text-primary/30 uppercase font-black tracking-[0.4em]">Curadoria Visual</p>
                        <div className="h-px w-6 bg-accent-gold/40"></div>
                    </div>
                    <div className="aspect-[4/5] w-full rounded-[48px] bg-background-dark relative overflow-hidden shadow-2xl border-8 border-white group">
                        <img
                            src="https://images.unsplash.com/photo-1515377905703-c4788e51af93?q=80&w=700&auto=format&fit=crop"
                            alt="Preview Mode"
                            className="w-full h-full object-cover grayscale-[20%] transition-transform duration-700 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-accent-gold/5 mix-blend-overlay"></div>
                        <div className="absolute top-10 left-0 right-0 text-center">
                            <h3 className="font-display italic text-white text-2xl drop-shadow-huge">JZ Studio</h3>
                        </div>
                        <div className="absolute bottom-10 left-10 flex items-center gap-3">
                            <div className="size-2 rounded-full bg-accent-gold animate-pulse"></div>
                            <span className="text-[9px] text-white font-black uppercase tracking-[0.3em] drop-shadow-md">Privé Member Elite</span>
                        </div>

                        <div className="absolute top-8 right-8 size-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 text-accent-gold shadow-huge">
                            <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>filter_vintage</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full grid gap-4 animate-reveal" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={handleInstagramShare}
                        className="group relative w-full h-20 bg-primary text-white rounded-3xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-2xl shadow-primary/20 flex items-center justify-between px-8 active:scale-95 transition-all"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-accent-gold border border-white/5">
                                <span className="material-symbols-outlined !text-xl">camera_alt</span>
                            </div>
                            <span className="group-hover:text-accent-gold transition-colors">Instagram Stories</span>
                        </div>
                        <span className="material-symbols-outlined text-white/20 group-hover:text-accent-gold transition-colors relative z-10">east</span>
                    </button>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAppShare}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="group relative w-full h-20 bg-white border border-primary/5 text-primary rounded-3xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-sm flex items-center justify-between px-8 active:scale-95 transition-all disabled:opacity-50 hover:border-accent-gold/20"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold transition-all duration-500 shadow-sm">
                                <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
                            </div>
                            <span className="group-hover:text-primary transition-colors">{uploading ? 'Processando...' : 'Timeline Studio (24h)'}</span>
                        </div>
                        {uploading ? (
                            <div className="size-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-primary/10 group-hover:text-primary transition-colors">add_circle</span>
                        )}
                    </button>
                </div>

                <footer className="pt-12 text-center select-none opacity-20">
                    <p className="font-display italic text-lg text-primary tracking-widest italic">A beleza compartilhada inspira.</p>
                </footer>
            </main>

            {/* Reward Feedback Overlay */}
            {pointsEarned && (
                <div className="fixed inset-0 bg-background-dark/95 z-[200] flex items-center justify-center animate-fade-in p-8 backdrop-blur-2xl">
                    <div className="text-center space-y-10 animate-reveal">
                        <div className="size-40 mx-auto relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-[40px] animate-pulse"></div>
                            <div className="relative size-32 rounded-full bg-accent-gold/10 flex items-center justify-center ring-4 ring-accent-gold/20 border border-accent-gold/40">
                                <span className="material-symbols-outlined !text-7xl text-accent-gold animate-bounce-slow" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.6em]">Recompensa Desbloqueada</p>
                            <h2 className="text-5xl font-display font-bold text-white mb-2">+{pointsEarned.amount}</h2>
                            <p className="text-lg font-outfit text-white/60 font-light tracking-widest uppercase">JZ Balance</p>
                        </div>

                        <p className="text-white/40 text-sm font-outfit italic leading-relaxed max-w-[240px] mx-auto">
                            {pointsEarned.type === 'INSTAGRAM' ? 'Seu momento exclusivo agora faz parte da nossa elite.' : 'Sua beleza está brilhando na timeline JZ Privé!'}
                        </p>

                        <button
                            onClick={() => {
                                setPointsEarned(null);
                                if (pointsEarned.type === 'APP') navigate('/stories');
                            }}
                            className="group relative px-12 py-5 bg-accent-gold text-primary rounded-2xl font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-accent-gold/10 overflow-hidden active:scale-95 transition-all"
                        >
                            <span className="relative z-10">Continuar Jornada</span>
                        </button>
                    </div>
                </div>
            )}
            {/* Visual Safe Area Inset */}
            <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
        </div>
    );
};

export default CheckInShare;
