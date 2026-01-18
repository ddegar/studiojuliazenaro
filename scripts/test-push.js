const webpush = require('web-push');

// REPLACE THESE WITH YOUR KEYS
const publicVapidKey = 'REPLACE_WITH_YOUR_PUBLIC_KEY';
const privateVapidKey = 'REPLACE_WITH_YOUR_PRIVATE_KEY';

webpush.setVapidDetails(
    'mailto:test@test.com',
    publicVapidKey,
    privateVapidKey
);

// REPLACE WITH A SUBSCRIPTION OBJECT FROM YOUR DB (console.log it from the frontend to get one)
const subscription = {
    endpoint: '...',
    keys: {
        p256dh: '...',
        auth: '...'
    }
};

const payload = JSON.stringify({ title: 'Teste Push', body: 'Funciona!' });

webpush.sendNotification(subscription, payload)
    .then(res => console.log('Enviado!', res.statusCode))
    .catch(err => console.error('Erro', err));
