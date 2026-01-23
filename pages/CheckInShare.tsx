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
        <div className="min-h-screen bg-[#FDF8F2] font-sans text-[#122B22] flex flex-col items-center relative overflow-hidden">
            {/* Header */}
            <header className="w-full px-8 pt-10 pb-4 flex items-center justify-between z-10">
                <button onClick={() => navigate(-1)} className="size-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all text-[#122B22]">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="font-serif italic text-lg font-medium text-[#122B22]">JZ Privé Club</h2>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 w-full max-w-sm px-6 flex flex-col items-center justify-center space-y-8 pb-10 z-10 relative">

                {/* Reward Card */}
                <div className="w-full bg-[#2A4038] text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20">
                        <span className="material-symbols-outlined !text-6xl text-[#C9A961]">auto_awesome</span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-[#C9A961]">
                        <span className="material-symbols-outlined text-sm">stars</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recompensa Exclusiva</span>
                    </div>

                    <h1 className="font-display text-3xl font-medium leading-tight mb-4">
                        Celebre sua beleza e ganhe 50 JZ Privé Balance
                    </h1>

                    <p className="text-white/60 text-xs leading-relaxed font-medium max-w-[90%]">
                        Compartilhe seu momento no JZ Studio e desbloqueie créditos exclusivos para sua próxima experiência de cuidado.
                    </p>
                </div>

                {/* Simulated Filter Preview */}
                <div className="w-full relative">
                    <p className="text-[9px] text-[#122B22]/40 font-black uppercase tracking-[0.3em] text-center mb-4">Pré-visualização do Filtro Premium</p>
                    <div className="aspect-[4/5] w-full rounded-[32px] bg-gray-200 relative overflow-hidden shadow-lg border-4 border-white">
                        <img
                            src="https://images.unsplash.com/photo-1515377905703-c4788e51af93?q=80&w=700&auto=format&fit=crop"
                            alt="Preview Mode"
                            className="w-full h-full object-cover grayscale-[20%]"
                        />

                        <div className="absolute inset-0 bg-[#C9A961]/10 mix-blend-overlay"></div>
                        <div className="absolute top-8 left-0 right-0 text-center">
                            <h3 className="font-serif italic text-white text-xl drop-shadow-md">JZ Studio</h3>
                        </div>
                        <div className="absolute bottom-8 left-8 flex items-center gap-2">
                            <div className="size-2 rounded-full bg-[#C9A961]"></div>
                            <span className="text-[10px] text-white font-black uppercase tracking-widest drop-shadow-md">Privé Member</span>
                        </div>

                        <button className="absolute top-6 right-6 size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white">
                            <span className="material-symbols-outlined !text-lg">filter_vintage</span>
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full space-y-4">
                    <button
                        onClick={handleInstagramShare}
                        className="w-full h-16 bg-[#2A4038] text-white rounded-[24px] font-bold text-sm flex items-center justify-between px-8 shadow-xl shadow-[#2A4038]/20 active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">camera_alt</span>
                            <span>Postar no Stories (Instagram)</span>
                        </div>
                        <span className="material-symbols-outlined">arrow_forward</span>
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
                        className="w-full h-16 bg-white border border-[#122B22]/5 text-[#122B22] rounded-[24px] font-serif italic text-lg flex items-center justify-between px-8 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#C9A961]">add_a_photo</span>
                            <span>{uploading ? 'Publicando...' : 'Storie no App (24h)'}</span>
                        </div>
                        {uploading ? (
                            <div className="size-5 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-[#122B22]/20">add_circle</span>
                        )}
                    </button>
                </div>

                <p className="font-serif italic text-sm text-[#122B22]/40 pt-4">Seu espaço de cuidado sempre te espera</p>

            </main>

            {/* Reward Feedback Overlay */}
            {pointsEarned && (
                <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in p-8">
                    <div className="text-center space-y-6">
                        <div className="size-32 mx-auto rounded-full bg-[#C9A961]/20 flex items-center justify-center ring-4 ring-[#C9A961]/10">
                            <span className="material-symbols-outlined !text-6xl text-[#C9A961] animate-bounce-slow">stars</span>
                        </div>
                        <div>
                            <h2 className="text-4xl font-display font-bold text-[#C9A961] mb-2">+{pointsEarned.amount}</h2>
                            <p className="text-xl text-white font-medium">JZ Privé Balance</p>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-[200px] mx-auto">
                            {pointsEarned.type === 'INSTAGRAM' ? 'Seu momento agora faz parte do JZ Privé Club.' : 'Sua beleza está brilhando no nosso App!'}
                        </p>
                        <button
                            onClick={() => {
                                setPointsEarned(null);
                                if (pointsEarned.type === 'APP') navigate('/stories');
                            }}
                            className="px-8 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs mt-4"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckInShare;
