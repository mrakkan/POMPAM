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
            clients.openWindow('/map')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default click - open map page
        event.waitUntil(
            clients.openWindow('/map')
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
            url: '/map'
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
        const payload = event.data.payload;
        const { title, body, icon, data, tag, requireInteraction, renotify, silent } = payload;
        
        // Detect if this is likely iOS based on available features
        const isLikelyIOS = !('vibrate' in navigator) || /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        console.log('Service Worker showing notification for:', isLikelyIOS ? 'iOS-like platform' : 'other platform');
        
        const options = {
            body: body,
            icon: icon || self.location.origin + '/static/images/truck.png',
            badge: self.location.origin + '/static/images/truck.png',
            tag: tag || 'pompam-notification',
            requireInteraction: requireInteraction !== undefined ? requireInteraction : isLikelyIOS,
            renotify: renotify !== undefined ? renotify : true,
            silent: silent !== undefined ? silent : false,
            data: data || { url: '/map' }
        };
        
        // เพิ่ม vibrate และ actions เฉพาะ non-iOS platforms
        if (!isLikelyIOS) {
            options.vibrate = [200, 100, 200];
            options.actions = [
                {
                    action: 'view-map',
                    title: 'ดูแผนที่'
                },
                {
                    action: 'dismiss',
                    title: 'ปิด'
                }
            ];
        }
        
        console.log('Service Worker notification options:', options);
        
        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => {
                    console.log('Service Worker notification shown successfully');
                })
                .catch(error => {
                    console.error('Service Worker notification error:', error);
                })
        );
    }
});