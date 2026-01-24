import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'primary' | 'white' | 'gold';
    forceLight?: boolean; // Kept for backward compatibility
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', variant, forceLight = false }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const activeVariant = variant || (forceLight ? 'white' : 'primary');

    const sizeClasses = {
        sm: 'w-[120px]',
        md: 'w-[180px]',
        lg: 'w-[260px]',
        xl: 'w-[320px]'
    };

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const cached = sessionStorage.getItem('studio_official_logo_v2');
                if (cached) {
                    setLogoUrl(cached);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('studio_config')
                    .select('value')
                    .eq('key', 'official_logo')
                    .single();

                if (data?.value) {
                    setLogoUrl(data.value);
                    sessionStorage.setItem('studio_official_logo_v2', data.value);
                }
            } catch (err) {
                console.error('Error fetching logo:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogo();
    }, []);

    if (loading) {
        return <div className={`animate-pulse bg-gray-200/10 rounded-lg ${sizeClasses[size]} h-12 ${className}`} />;
    }

    // Pure HTML/CSS Fallback in case storage is empty or image fails
    const FallbackLogo = () => (
        <div className={`flex flex-col items-center ${className}`}>
            <span className={`${size === 'lg' || size === 'xl' ? 'text-[10px]' : 'text-[8px]'} font-sans font-bold tracking-[0.4em] ${activeVariant === 'white' ? 'text-white/60' : (activeVariant === 'gold' ? 'text-accent-gold/60' : 'text-primary/60')} uppercase mb-1`}>Studio</span>
            <span className={`${size === 'lg' || size === 'xl' ? 'text-4xl' : 'text-2xl'} font-display font-bold tracking-[0.05em] ${activeVariant === 'white' ? 'text-white' : (activeVariant === 'gold' ? 'text-accent-gold' : 'text-primary')} uppercase leading-none`}>Julia</span>
            <span className={`${size === 'lg' || size === 'xl' ? 'text-4xl' : 'text-2xl'} font-display font-bold tracking-[0.05em] ${activeVariant === 'white' ? 'text-white' : (activeVariant === 'gold' ? 'text-accent-gold' : 'text-primary')} uppercase mt-1`}>Zenaro</span>

            <div className="flex items-center gap-4 w-full mt-6">
                <div className={`h-[1px] flex-1 ${activeVariant === 'white' ? 'bg-white/20' : 'bg-accent-gold/30'}`}></div>
                <span className={`${size === 'lg' || size === 'xl' ? 'text-[10px]' : 'text-[8px]'} tracking-[0.4em] font-black ${activeVariant === 'white' ? 'text-white/70' : 'text-accent-gold'} uppercase`}>JZ Privé</span>
                <div className={`h-[1px] flex-1 ${activeVariant === 'white' ? 'bg-white/20' : 'bg-accent-gold/30'}`}></div>
            </div>
        </div>
    );

    if (!logoUrl) return <FallbackLogo />;

    // For the image, we use filters for variants instead of just brightness/invert
    const getFilter = () => {
        if (activeVariant === 'white') return 'brightness(0) invert(1)';
        if (activeVariant === 'gold') return 'sepia(1) saturate(5) hue-rotate(5deg) brightness(0.9)'; // High-end gold approximation
        return 'none';
    };

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <img
                src={logoUrl}
                alt="Studio Julia Zenaro"
                className={`w-full h-auto object-contain transition-all duration-500`}
                style={{ filter: getFilter() }}
                onError={() => setLogoUrl(null)}
            />
        </div>
    );
};

export default Logo;
