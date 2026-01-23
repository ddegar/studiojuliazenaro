import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    forceLight?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', forceLight = false }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const sizeClasses = {
        sm: 'w-[140px]',
        md: 'w-[200px]',
        lg: 'w-[300px]',
        xl: 'w-[400px]'
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
            <span className={`${size === 'lg' ? 'text-[10px]' : 'text-[8px]'} font-sans font-bold tracking-[0.4em] ${forceLight ? 'text-white/60' : 'text-primary/60'} uppercase mb-1`}>Studio</span>
            <span className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-display font-bold tracking-[0.05em] ${forceLight ? 'text-white' : 'text-primary'} uppercase leading-none`}>Julia</span>
            <span className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-display font-bold tracking-[0.05em] ${forceLight ? 'text-white' : 'text-primary'} uppercase mt-1`}>Zenaro</span>

            <div className="flex items-center gap-4 w-full mt-6">
                <div className={`h-[1px] flex-1 ${forceLight ? 'bg-white/20' : 'bg-accent-gold/30'}`}></div>
                <span className={`${size === 'lg' ? 'text-[10px]' : 'text-[8px]'} tracking-[0.4em] font-black ${forceLight ? 'text-white/70' : 'text-accent-gold'} uppercase`}>JZ Privé</span>
                <div className={`h-[1px] flex-1 ${forceLight ? 'bg-white/20' : 'bg-accent-gold/30'}`}></div>
            </div>
        </div>
    );

    if (!logoUrl) return <FallbackLogo />;

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <img
                src={logoUrl}
                alt="Studio Julia Zenaro"
                className={`w-full h-auto object-contain transition-opacity duration-500 ${forceLight ? 'brightness-0 invert' : ''}`}
                onError={() => setLogoUrl(null)}
            />
        </div>
    );
};

export default Logo;
