import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const JZ_OVERLAY_URL = "/overlay_prive.png";

const CheckInFilter: React.FC = () => {
    const navigate = useNavigate();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingApp, setUploadingApp] = useState(false);
    const [pointsEarned, setPointsEarned] = useState<{ amount: number, type: 'INSTAGRAM' | 'APP' } | null>(null);

    // Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageSrc(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Process Image (Apply Overlay)
    useEffect(() => {
        if (!imageSrc || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const userImg = new Image();
        userImg.crossOrigin = "anonymous";
        userImg.src = imageSrc;

        userImg.onload = () => {
            // Set canvas dimensions to 1080x1920 (Stories format)
            canvas.width = 1080;
            canvas.height = 1920;

            // Draw User Image (Cover/Center Crop)
            const aspect = userImg.width / userImg.height;
            const targetAspect = 1080 / 1920;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (aspect > targetAspect) {
                drawHeight = 1920;
                drawWidth = 1920 * aspect;
                offsetX = (1080 - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = 1080;
                drawHeight = 1080 / aspect;
                offsetX = 0;
                offsetY = (1920 - drawHeight) / 2;
            }

            ctx.drawImage(userImg, offsetX, offsetY, drawWidth, drawHeight);

            // Draw Overlay
            const overlayImg = new Image();
            overlayImg.crossOrigin = "anonymous";
            overlayImg.src = JZ_OVERLAY_URL;

            overlayImg.onload = () => {
                ctx.drawImage(overlayImg, 0, 0, 1080, 1920);
                setProcessedImage(canvas.toDataURL('image/png', 0.9));
            };

            overlayImg.onerror = () => {
                console.error("Failed to load overlay");
                // Fallback drawing logic
                const gradient = ctx.createLinearGradient(0, 1500, 0, 1920);
                gradient.addColorStop(0, "transparent");
                gradient.addColorStop(1, "rgba(0,0,0,0.8)");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1080, 1920);

                ctx.fillStyle = "#C9A961";
                ctx.font = "italic bold 60px Serif";
                ctx.textAlign = "center";
                ctx.fillText("JZ Privé Club", 540, 1800);

                ctx.font = "40px Sans-serif";
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.fillText("@JuliaZenaro", 540, 1860);

                setProcessedImage(canvas.toDataURL('image/png', 0.9));
            };
        };

    }, [imageSrc]);

    const handleInstagramShare = async () => {
        if (!processedImage) return;
        setLoading(true);

        try {
            await processRewards('STORY_INSTA', 'Compartilhamento Stories Instagram');

            const blob = await (await fetch(processedImage)).blob();
            const file = new File([blob], 'jz-prive-story.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'JZ Privé Club',
                    text: 'Meu momento exclusivo no Studio Julia Zenaro ✨'
                });
            } else {
                const link = document.createElement('a');
                link.href = processedImage;
                link.download = 'jz-prive-story.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                alert('Imagem salva! Compartilhe no seu Instagram Stories.');
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao processar: ' + error);
        } finally {
            setLoading(false);
        }
    };

    const handleAppShare = async () => {
        if (!processedImage) return;
        setUploadingApp(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // Convert DataURL to Blob
            const blob = await (await fetch(processedImage)).blob();
            const file = new File([blob], `app_story_${Date.now()}.png`, { type: 'image/png' });

            // 1. Upload Image
            const fileName = `${user.id}_${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('stories')
                .getPublicUrl(fileName);

            // 3. Insert into Stories Table (Expires in 24h)
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
            await processRewards('STORY_STUDIO', 'Storie no App JZ Privé');

            setTimeout(() => {
                alert('Seu momento foi compartilhado no App JZ Privé e ficará visível por 24h! ✨');
                navigate('/stories');
            }, 1000); // Wait for reward modal to show briefly if needed

        } catch (error: any) {
            console.error('Error sharing story to app:', error);
            alert('Erro ao compartilhar: ' + error.message);
        } finally {
            setUploadingApp(false);
        }
    };

    const processRewards = async (actionCode: string, description: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get rule from Admin
        const { data: rule } = await supabase
            .from('loyalty_actions')
            .select('points_reward, is_active')
            .eq('code', actionCode)
            .single();

        if (!rule || !rule.is_active) return;

        // 2. Anti-fraud check: Only ONE reward per 24 hours for ANY story sharing action
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentTx } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('user_id', user.id)
            .in('source', ['STORY_INSTA', 'STORY_STUDIO', 'STORY_SHARE', 'APP_STORY_SHARE']) // Legacy and new codes
            .gt('created_at', twentyFourHoursAgo)
            .limit(1);

        if (recentTx && recentTx.length > 0) {
            console.log('Reward already claimed in the last 24h');
            return;
        }

        const amount = rule.points_reward;

        // 3. Register Transaction
        await supabase.from('point_transactions').insert({
            user_id: user.id,
            amount: amount,
            source: actionCode,
            description: description
        });

        // 4. Update Balance via RPC
        await supabase.rpc('increment_lash_points', {
            user_id_param: user.id,
            amount_param: amount
        });

        setPointsEarned({ amount, type: actionCode === 'STORY_INSTA' ? 'INSTAGRAM' : 'APP' });
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

                {/* Canvas Hidden */}
                <canvas ref={canvasRef} className="hidden"></canvas>

                {!imageSrc ? (
                    <>
                        {/* Reward Card */}
                        <div className="w-full bg-[#2A4038] text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                <span className="material-symbols-outlined !text-6xl text-[#C9A961]">filter_vintage</span>
                            </div>

                            <div className="flex items-center gap-2 mb-4 text-[#C9A961]">
                                <span className="material-symbols-outlined text-sm">stars</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exclusividade</span>
                            </div>

                            <h1 className="font-display text-3xl font-medium leading-tight mb-4">
                                Celebre sua Beleza com o Filtro Oficial e ganhe 50 JZ Privé Balance
                            </h1>

                            <p className="text-white/60 text-xs leading-relaxed font-medium max-w-[90%]">
                                Aplique o overlay premium JZ Privé e compartilhe seu momento único.
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-16 bg-[#2A4038] text-white rounded-[24px] font-bold text-sm flex items-center justify-between px-8 shadow-xl shadow-[#2A4038]/20 active:scale-95 transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined">photo_camera</span>
                                    <span>Tirar Foto Agora</span>
                                </div>
                                <span className="material-symbols-outlined">arrow_forward</span>
                                <input type="file" accept="image/*" capture="user" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            </button>

                            <button
                                onClick={() => galleryInputRef.current?.click()}
                                className="w-full h-16 bg-white border border-[#122B22]/5 text-[#122B22] rounded-[24px] font-serif italic text-lg flex items-center justify-between px-8 shadow-sm active:scale-95 transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#C9A961]">photo_library</span>
                                    <span>Escolher da Galeria</span>
                                </div>
                                <span className="material-symbols-outlined text-[#122B22]/20">add_circle</span>
                                <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileChange} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center w-full h-full">
                        <p className="text-[9px] text-[#122B22]/40 font-black uppercase tracking-[0.3em] text-center mb-4">Pré-visualização do Filtro Premium</p>

                        <div className="relative w-full aspect-[9/16] max-h-[55vh] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white mb-6 bg-zinc-900">
                            {processedImage ? (
                                <img src={processedImage} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="size-10 border-4 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleInstagramShare}
                                disabled={loading || uploadingApp || !processedImage}
                                className="w-full h-14 bg-[#2A4038] text-white rounded-[20px] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(42,64,56,0.3)] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="size-4 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">camera_alt</span>
                                        <span>Postar no Instagram (+50)</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleAppShare}
                                disabled={loading || uploadingApp || !processedImage}
                                className="w-full h-14 bg-white border border-[#2A4038]/10 text-[#2A4038] rounded-[20px] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                            >
                                {uploadingApp ? (
                                    <div className="size-4 border-2 border-[#2A4038] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg text-[#C9A961]">add_a_photo</span>
                                        <span>Storie no App (+30)</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => setImageSrc(null)}
                            className="mt-4 text-xs font-medium text-[#122B22]/40 underline"
                        >
                            Trocar foto
                        </button>
                    </div>
                )}

                <p className="font-serif italic text-sm text-[#122B22]/40 pt-4">Seu espaço de cuidado sempre te espera</p>
            </main>

            {/* Background Blob like Share page */}
            <div className="fixed top-[-20%] left-[-20%] w-[80%] h-[50%] bg-[#C9A961]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

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
                                if (pointsEarned.type === 'APP') navigate('/stories'); // App goes to stories to confirm
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

export default CheckInFilter;
