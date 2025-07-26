// Service Worker for POMPAM Notifications
const CACHE_NAME = 'pompam-notifications-v1';
const urlsToCache = [
    '/static/images/truck.png',
    '/static/images/Group.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
        )
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    // Handle different actions
    if (event.action === 'view-map') {
        // Open map page
        event.waitUntil(
            clients.openWindow('/map-page')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default click - open map page
        event.waitUntil(
            clients.openWindow('/map-page')
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
    console.log('Notification closed:', event);
});

// Handle push events (for future push notifications)
self.addEventListener('push', event => {
    console.log('Push event received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'รถป๋อมแป๋มใกล้มาถึงแล้ว!',
        icon: '/static/images/truck.png',
        badge: '/static/images/truck.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/map-page'
        },
        actions: [
            {
                action: 'view-map',
                title: 'ดูแผนที่'
            },
            {
                action: 'dismiss',
                title: 'ปิด'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('POMPAM - การแจ้งเตือน', options)
    );
});

// Background sync (for offline functionality)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Handle background sync tasks
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, data } = event.data.payload;
        
        const options = {
            body: body,
            icon: icon || '/static/images/truck.png',
            badge: '/static/images/truck.png',
            vibrate: [200, 100, 200],
            data: data,
            requireInteraction: true,
            actions: [
                {
                    action: 'view-map',
                    title: 'ดูแผนที่'
                },
                {
                    action: 'dismiss',
                    title: 'ปิด'
                }
            ]
        };
        
        self.registration.showNotification(title, options);
    }
});