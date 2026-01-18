self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'Nova atualização do Studio Julia Zenaro',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Studio Julia Zenaro', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
