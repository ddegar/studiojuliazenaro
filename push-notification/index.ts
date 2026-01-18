// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";

const vapidKeys = {
    publicKey: Deno.env.get("VAPID_PUBLIC_KEY")!,
    privateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
    subject: "mailto:admin@studiojuliazenaro.com",
};

webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

serve(async (req) => {
    try {
        const { record } = await req.json(); // Payload from Database Webhook (INSERT on appointments)

        // Create Supabase Client to fetch user's subscription
        // (Or pass it in payload if joined, but usually just ID comes)
        // For simplicity, we assume we receive userId to look up.

        // NOTE: In a real webhook, you'd fetch the subscription from the DB using the User ID
        // const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', record.user_id)

        // Mocking the send for the template
        console.log("Processing push for", record);

        return new Response(JSON.stringify({ message: "Push Sent (Simulated)" }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
});
