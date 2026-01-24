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
                        <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Creative Studio</p>
                        <h2 className="text-xl font-display italic text-primary tracking-tight">Experiência Visual</h2>
                    </div>
                </div>
                <div className="size-10"></div>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-sm mx-auto p-8 space-y-10">
                {/* Canvas Hidden */}
                <canvas ref={canvasRef} className="hidden"></canvas>

                {!imageSrc ? (
                    <div className="space-y-12 animate-reveal">
                        {/* Elite Incentive Card */}
                        <div className="group relative bg-primary p-10 rounded-[48px] shadow-2xl shadow-primary/20 overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:rotate-45 duration-700">
                                <span className="material-symbols-outlined !text-7xl text-accent-gold">filter_vintage</span>
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-accent-gold border border-white/5">
                                        <span className="material-symbols-outlined !text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                    </span>
                                    <span className="text-[9px] font-outfit font-black uppercase tracking-[0.3em] text-white/60">Exclusividade JZ</span>
                                </div>

                                <h1 className="text-3xl font-display text-white leading-tight">
                                    Sua beleza <br /><span className="italic text-accent-gold"> merece um </span> quadro.
                                </h1>

                                <p className="text-xs font-outfit text-white/40 leading-relaxed font-light italic">
                                    Aplique o overlay diamantado JZ Privé e receba <span className="text-accent-gold font-bold">50 Lash Points</span> pela sua arte.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 w-full">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative w-full h-20 bg-white border border-accent-gold/20 rounded-3xl flex items-center justify-between px-8 shadow-xl transition-all active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                        <span className="material-symbols-outlined">photo_camera</span>
                                    </div>
                                    <span className="text-sm font-outfit font-bold text-primary">Capturar Agora</span>
                                </div>
                                <span className="material-symbols-outlined text-primary/20 group-hover:text-accent-gold transition-colors">east</span>
                                <input type="file" accept="image/*" capture="user" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            </button>

                            <button
                                onClick={() => galleryInputRef.current?.click()}
                                className="group relative w-full h-20 bg-white/40 border border-primary/5 rounded-3xl flex items-center justify-between px-8 shadow-sm transition-all active:scale-95 overflow-hidden hover:bg-white hover:border-accent-gold/20"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold transition-all duration-500 shadow-sm">
                                        <span className="material-symbols-outlined">photo_library</span>
                                    </div>
                                    <span className="text-sm font-outfit font-bold text-primary/60 group-hover:text-primary transition-colors">Galeria Exclusiva</span>
                                </div>
                                <span className="material-symbols-outlined text-primary/10 group-hover:text-primary transition-colors">add_circle</span>
                                <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileChange} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full animate-reveal">
                        <div className="flex flex-col items-center gap-2 mb-8">
                            <p className="text-[10px] text-primary/30 uppercase font-black tracking-[0.4em]">Laboratório Visual</p>
                            <h3 className="text-lg font-display text-primary">Prévia do Filtro Premium</h3>
                        </div>

                        <div className="relative mx-auto w-full max-w-[320px] aspect-[9/16] max-h-[70vh] rounded-[48px] overflow-hidden shadow-huge border-[6px] border-white mb-10 bg-background-dark group">
                            {processedImage ? (
                                <img src={processedImage} className="w-full h-full object-contain animate-fade-in" alt="Preview" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                    <div className="relative size-12 flex items-center justify-center">
                                        <div className="absolute inset-0 border-2 border-accent-gold/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Sincronizando Arte</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full grid gap-4">
                            <button
                                onClick={handleInstagramShare}
                                disabled={loading || uploadingApp || !processedImage}
                                className="group relative w-full h-18 bg-primary text-white rounded-2xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="size-4 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                        <span className="material-symbols-outlined !text-xl group-hover:text-accent-gold transition-colors">camera_alt</span>
                                        <span className="group-hover:text-accent-gold transition-colors">Postar Instagram (+50)</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleAppShare}
                                disabled={loading || uploadingApp || !processedImage}
                                className="group relative w-full h-18 bg-white border border-primary/5 text-primary rounded-2xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 hover:border-accent-gold/20"
                            >
                                {uploadingApp ? (
                                    <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined !text-xl text-accent-gold group-hover:scale-110 transition-transform">add_a_photo</span>
                                        <span>Storie no App (+30)</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => setImageSrc(null)}
                            className="mt-8 px-6 py-2 rounded-full bg-primary/5 text-[9px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors"
                        >
                            Refazer Captura
                        </button>
                    </div>
                )}

                <footer className="pt-12 text-center select-none opacity-20">
                    <p className="font-display italic text-lg text-primary tracking-widest italic">A beleza em alta definição.</p>
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
                            <p className="text-lg font-outfit text-white/60 font-light tracking-widest uppercase">Lash Points</p>
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

export default CheckInFilter;
