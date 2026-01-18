import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !PUBLIC_VAPID_KEY || PUBLIC_VAPID_KEY.startsWith('REPLACE')) {
            console.warn('Push notifications not enabled properly.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Request permission (Must be in click handler)
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') return;

            // Subscribe
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            setSubscription(sub);

            // Send to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user && sub) {
                const p256dh = sub.toJSON().keys?.p256dh;
                const auth = sub.toJSON().keys?.auth;

                if (p256dh && auth) {
                    const { error } = await supabase.from('push_subscriptions').upsert({
                        user_id: user.id,
                        endpoint: sub.endpoint,
                        p256dh: p256dh,
                        auth: auth
                    }, { onConflict: 'user_id, endpoint' });

                    if (error) console.error('Supabase error:', error);
                    else alert('Notificações ativadas com sucesso! 🔔');
                }
            }

        } catch (error: any) {
            console.error('Error subscribing to push:', error);
            alert('Erro ao ativar notificações: ' + error.message);
        }
    };

    return { subscription, permission, subscribeToPush };
}
