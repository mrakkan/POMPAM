// Notification System for POMPAM with Browser Notifications
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.init();
    }

    init() {
        this.requestNotificationPermission();
        this.createNotificationContainer();
        this.createNotificationBell();
        this.setupServiceWorker();
        this.simulateDeliveryNotifications();
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('การแจ้งเตือนได้รับอนุญาตแล้ว');
                    this.showWelcomeNotification();
                } else {
                    console.log('การแจ้งเตือนถูกปฏิเสธ');
                }
            }
        } else {
            console.log('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
        }
    }

    showWelcomeNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const welcomeNotification = new Notification('ยินดีต้อนรับสู่ POMPAM!', {
                body: 'คุณจะได้รับการแจ้งเตือนเมื่อรถป๋อมแป๋มใกล้มาถึง',
                icon: '/static/images/truck.png',
                tag: 'welcome'
            });

            setTimeout(() => {
                welcomeNotification.close();
            }, 5000);
        }
    }

    setupServiceWorker() {
        // Register service worker for better notification handling
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    createNotificationContainer() {
        // Create notification dropdown
        const notificationHTML = `
            <div id="notification-container" class="notification-container">
                <div id="notification-bell" class="notification-bell">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                    <span id="notification-count" class="notification-count">0</span>
                </div>
                <div id="notification-dropdown" class="notification-dropdown">
                    <div class="notification-header">
                        <h3>การแจ้งเตือน</h3>
                        <button id="clear-all" class="clear-all-btn">ล้างทั้งหมด</button>
                    </div>
                    <div id="notification-list" class="notification-list">
                        <div class="no-notifications">ไม่มีการแจ้งเตือน</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
        this.setupEventListeners();
    }

    createNotificationBell() {
        // Add notification bell to header or top of page
        const bellContainer = document.getElementById('notification-container');
        if (bellContainer) {
            bellContainer.style.position = 'fixed';
            bellContainer.style.top = '20px';
            bellContainer.style.right = '20px';
            bellContainer.style.zIndex = '1000';
        }
    }

    setupEventListeners() {
        const bell = document.getElementById('notification-bell');
        const dropdown = document.getElementById('notification-dropdown');
        const clearAll = document.getElementById('clear-all');

        bell.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        clearAll.addEventListener('click', () => {
            this.clearAllNotifications();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    addNotification(title, message, type = 'delivery', truckId = null) {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            truckId,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.updateNotificationDisplay();
        this.showBrowserNotification(notification);
        this.showToast(notification);
        this.updateNotificationCount();
        this.shakeBell();
    }

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body: notification.message,
                icon: '/static/images/truck.png',
                badge: '/static/images/truck.png',
                tag: `pompam-${notification.id}-${Date.now()}`, // ใช้ timestamp เพื่อให้แต่ละการแจ้งเตือนมี tag ที่ไม่ซ้ำกัน
                requireInteraction: false, // เปลี่ยนเป็น false เพื่อให้การแจ้งเตือนหลายๆ อันสามารถแสดงพร้อมกันได้
                silent: false,
                vibrate: [200, 100, 200],
                data: {
                    notificationId: notification.id,
                    truckId: notification.truckId,
                    url: '/map-page'
                }
            };

            const browserNotification = new Notification(notification.title, options);

            browserNotification.onclick = () => {
                window.focus();
                window.location.href = '/map-page';
                browserNotification.close();
                this.markAsRead(notification.id);
            };

            browserNotification.onclose = () => {
                console.log('Notification closed');
            };

            // Auto close after 15 seconds
            setTimeout(() => {
                browserNotification.close();
            }, 15000);
        } else if (Notification.permission === 'denied') {
            console.log('การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์');
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationDisplay();
            this.updateNotificationCount();
        }
    }

    shakeBell() {
        const bell = document.getElementById('notification-bell');
        if (bell) {
            bell.classList.add('shake');
            setTimeout(() => {
                bell.classList.remove('shake');
            }, 500);
        }
    }

    updateNotificationDisplay() {
        const notificationList = document.getElementById('notification-list');
        
        if (this.notifications.length === 0) {
            notificationList.innerHTML = '<div class="no-notifications">ไม่มีการแจ้งเตือน</div>';
            return;
        }

        const notificationsHTML = this.notifications.map(notification => {
            const timeAgo = this.getTimeAgo(notification.timestamp);
            return `
                <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                    <div class="notification-icon">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <button class="notification-action" onclick="notificationManager.handleNotificationClick('${notification.id}')">
                        ดูแผนที่
                    </button>
                </div>
            `;
        }).join('');

        notificationList.innerHTML = notificationsHTML;
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'delivery':
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#e60000"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/></svg>';
            case 'arrival':
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
            default:
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#666"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'เมื่อสักครู่';
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        return `${days} วันที่แล้ว`;
    }

    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const countElement = document.getElementById('notification-count');
        
        if (unreadCount > 0) {
            countElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
            countElement.style.display = 'block';
        } else {
            countElement.style.display = 'none';
        }
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="toast-text">
                    <div class="toast-title">${notification.title}</div>
                    <div class="toast-message">${notification.message}</div>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 5000);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        });
    }

    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationDisplay();
            this.updateNotificationCount();
            
            // Navigate to map page
            window.location.href = '/map-page';
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationDisplay();
        this.updateNotificationCount();
    }

    simulateDeliveryNotifications() {
        // Simulate truck approaching notifications
        const trucks = [
            { id: 'POMPAM-01', name: 'รถป๋อมแป๋ม 01', location: 'ใกล้ตลาดนัดจตุจักร' },
            { id: 'POMPAM-02', name: 'รถป๋อมแป๋ม 02', location: 'ใกล้มหาวิทยาลัยธรรมศาสตร์' },
            { id: 'POMPAM-03', name: 'รถป๋อมแป๋ม 03', location: 'ใกล้เซ็นทรัลเวิลด์' }
        ];

        // Add initial notification after 3 seconds
        setTimeout(() => {
            const truck = trucks[Math.floor(Math.random() * trucks.length)];
            this.addNotification(
                '🚛 รถใกล้มาถึงแล้ว!',
                `${truck.name} ${truck.location} - คาดว่าจะมาถึงใน 5-10 นาที`,
                'delivery',
                truck.id
            );
        }, 3000);

        // Add more notifications periodically
        setInterval(() => {
            if (Math.random() < 0.4) { // 40% chance every interval
                const truck = trucks[Math.floor(Math.random() * trucks.length)];
                const messages = [
                    `${truck.name} ${truck.location} - คาดว่าจะมาถึงใน 5-10 นาที`,
                    `${truck.name} กำลังเดินทางมา - อีก 15 นาที`,
                    `${truck.name} มาถึงแล้ว! ${truck.location}`,
                    `${truck.name} เหลือเวลาอีก 3 นาที - เตรียมตัวรับสินค้า`,
                    `${truck.name} เริ่มขายแล้ว! มาเลือกซื้อสินค้าสดใหม่กันเถอะ`
                ];
                
                const titles = [
                    '🚛 อัพเดทสถานะรถ',
                    '📍 รถใกล้มาถึง',
                    '✅ รถมาถึงแล้ว!',
                    '⏰ เตรียมตัวรับสินค้า',
                    '🛒 เริ่มขายแล้ว!'
                ];
                
                this.addNotification(
                    titles[Math.floor(Math.random() * titles.length)],
                    messages[Math.floor(Math.random() * messages.length)],
                    Math.random() < 0.7 ? 'delivery' : 'arrival',
                    truck.id
                );
            }
        }, 25000); // Every 25 seconds
    }

    // Method to manually trigger a test notification
    testNotification() {
        this.addNotification(
            '🧪 ทดสอบการแจ้งเตือน',
            'นี่คือการแจ้งเตือนทดสอบ - คลิกเพื่อไปยังแผนที่',
            'delivery',
            'TEST-01'
        );
    }
}

// Initialize notification manager when page loads
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
});

// Handle page visibility change to show notifications when user returns
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && notificationManager) {
        // User returned to the page, update notification display
        notificationManager.updateNotificationDisplay();
        notificationManager.updateNotificationCount();
    }
});