
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORY_ITEMS = [
  { id: 1, type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiUm0OZLOAP3cwAd_kNhaySJIszM9lcCyidOrD36A0RJ6cgwHJtfgn-lnpXqaAtE8iKs_YU3tXlcSsuZ0boGn5bLhQ__y8m82EMKH2DKzjgEEHyZ1pmUPWmW5KqZdNlIbHCMNfZlZgTLPjH7QSoYmAh-qkuUgWkfB1bLAL9lAqTIGQXxHt2HZaaS8wd9pc6vbCGoTliddw2HMZP_26xr-73B0_wHcoCtg2hiy8ZRQqd_0azA75gvWqpOx-6c3PBhvPgsS5zz4Ckuc' },
  { id: 2, type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrbNG905ki_EKBSesdkup3q0zgyKy4bT6XnNVqDa2A9Bgtz-Rqq57Q3RrlVYO7Ac6WYmQqGkm7z4yb2iVMM21BDGDYwuqPzvXVm5GPe2j4T21BrLuQ599r5_xLOUxE3U89eQbxf6wu9m8IsMd_Pixc7MoorzNVhcuEGkPwcSLNSrDctCYxAYNGlTCtrZoXOq2m0b4d7INR_XUqOwDa1ie2xH7Ju1I8PZ80UukCC2Hb9TTBClh68QYm9ayWVMWwiM1PxjDO6KxR_9s' },
  { id: 3, type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpCEMVJ_EJjNocA-taBx3vGxySp-TaVEtDWp2gflmvK5Yvo6uzfsEk6nNTKUT2Ri5XLp2UFBbhSHxXkfr3TZQzA2gjiBbXqfBwIB1F2883WUFWJxee6SEZNnfgNRlKxwHMAH19P6aXY8yyoIiRcrkIM6IJYkNTkO7HWW-Im3O1J1bVQREfi65cpNuy9I8djZjFBSfcizhkBWZGkBgz8vepAUf4Bk9UgjMBb3M9ym1-uM2bYLueGuOGpYtrE6_ZDvWusVuO3oJ_kWs' },
];

const Stories: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < STORY_ITEMS.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            navigate('/home');
            return 100;
          }
        }
        return p + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, navigate]);

  const handleTouch = (e: React.MouseEvent) => {
    const { clientX } = e;
    const width = window.innerWidth;
    if (clientX < width / 3) {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setProgress(0);
      }
    } else {
      if (currentIndex < STORY_ITEMS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setProgress(0);
      } else {
        navigate('/home');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black relative">
      {/* Bars */}
      <div className="absolute top-4 left-0 w-full flex gap-1 px-4 z-50">
        {STORY_ITEMS.map((item, idx) => (
          <div key={item.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-50"
              style={{ width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 w-full flex items-center justify-between px-4 z-50">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/40 overflow-hidden">
               <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgP7x4eCYp0QiObY4La3mDeH2HXiRR_zzsFXPoGMHbcgAfGsTX7F6W2ythsxdEMJbo6Qgar7XCdK-OuxM24PzXqUoJXfUXAYWx9BCxE9yBMT4q3dfmhPFymgjk36b5TZa8GDpS2tW4oGeT235bmwnLN7wLCFbGnwOFqT-WJfFJaYudP8IJ35KeI7lzo0pyiPnLm-kERQbD2cC7xYoRLBMEMlNBI2JdQ_ngbL9U516MUkvkgxRQFryjXCnA_uMkCRhpyl6Erek5TYo" alt="Julia" />
            </div>
            <div className="text-white">
               <p className="text-sm font-bold">Studio Julia Zenaro</p>
               <p className="text-[10px] opacity-60">2h atrás</p>
            </div>
         </div>
         <button onClick={() => navigate('/home')} className="material-symbols-outlined text-white text-3xl">close</button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 w-full bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${STORY_ITEMS[currentIndex].url})` }}
        onClick={handleTouch}
      ></div>

      {/* Footer */}
      <div className="p-6 pb-10 flex items-center gap-4 bg-gradient-to-t from-black/60 to-transparent">
         <input 
           type="text" 
           placeholder="Enviar uma mensagem..." 
           className="flex-1 bg-white/10 border-white/20 text-white rounded-full h-12 px-6 text-sm placeholder:text-white/40 focus:ring-accent-gold"
         />
         <button className="material-symbols-outlined text-white text-2xl">favorite</button>
         <button className="material-symbols-outlined text-white text-2xl">send</button>
      </div>
    </div>
  );
};

export default Stories;
