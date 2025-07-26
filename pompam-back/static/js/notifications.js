// Notification System for POMPAM with Browser Notifications
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.loadNotificationsFromStorage();
        this.init();
    }

    init() {
        this.requestNotificationPermission();
        this.createNotificationContainer();
        this.createNotificationBell();
        this.setupServiceWorker();
        this.updateNotificationDisplay();
        this.updateNotificationCount();
        
        // Clear old notifications periodically (every 30 minutes)
        setInterval(() => {
            this.clearOldNotifications();
        }, 30 * 60 * 1000);
        
        // Only start simulation if this is the first time loading (no existing notifications)
        if (this.notifications.length === 0) {
            this.simulateDeliveryNotifications();
        } else {
            // If we have existing notifications, still start the periodic simulation but with a delay
            setTimeout(() => {
                this.startPeriodicNotifications();
            }, 10000); // Start after 10 seconds
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
            
            // Check if Push API is available (required for iOS Safari)
            const hasPushAPI = 'PushManager' in window;
            
            // Debug logging for standalone mode
            console.log('=== PWA Debug Info ===');
            console.log('isIOS:', isIOS);
            console.log('isSafari:', isSafari);
            console.log('isStandalone:', isStandalone);
            console.log('hasPushAPI:', hasPushAPI);
            console.log('window.navigator.standalone:', window.navigator.standalone);
            console.log('display-mode standalone:', window.matchMedia('(display-mode: standalone)').matches);
            console.log('Notification permission:', Notification.permission);
            console.log('======================');
            
            // For iOS in standalone mode (PWA), always try to request permission
            if (isIOS && isStandalone) {
                console.log('iOS PWA detected - proceeding with notification setup');
            } else if (isIOS && isSafari && !isStandalone && !hasPushAPI) {
                // For iOS Safari without Push API, show special instructions
                this.showIOSInstructions();
                return;
            }
            
            if (Notification.permission === 'default') {
                // สำหรับ iOS ต้องขอ permission ผ่าน user interaction
                if (isIOS) {
                    console.log('iOS detected - notification permission requires user interaction');
                    // สร้างปุ่มสำหรับขอ permission บน iOS
                    this.createPermissionButton();
                } else {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('การแจ้งเตือนได้รับอนุญาตแล้ว');
                        this.showWelcomeNotification();
                    } else {
                        console.log('การแจ้งเตือนถูกปฏิเสธ');
                    }
                }
            } else if (Notification.permission === 'granted') {
                console.log('การแจ้งเตือนได้รับอนุญาตแล้ว');
                if (isIOS) {
                    // สำหรับ iOS แสดงคำแนะนำเพิ่มเติม
                    console.log('iOS: กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนใน Settings > Safari > การแจ้งเตือน');
                }
            }
        } else {
            console.log('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
        }
    }

    createPermissionButton() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS && Notification.permission === 'default') {
            const permissionButton = document.createElement('button');
            permissionButton.id = 'ios-notification-permission';
            permissionButton.textContent = 'เปิดการแจ้งเตือน';
            permissionButton.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 1001;
                background: #e60000;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            
            permissionButton.addEventListener('click', async () => {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('iOS: การแจ้งเตือนได้รับอนุญาตแล้ว');
                    permissionButton.remove();
                    this.showWelcomeNotification();
                } else {
                    console.log('iOS: การแจ้งเตือนถูกปฏิเสธ');
                    alert('กรุณาเปิดการแจ้งเตือนใน Settings > Safari > การแจ้งเตือน');
                }
            });
            
            document.body.appendChild(permissionButton);
        }
    }

    showWelcomeNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            const options = {
                body: 'คุณจะได้รับการแจ้งเตือนเมื่อรถป๋อมแป๋มใกล้มาถึง',
                icon: window.location.origin + '/static/images/truck.png',
                tag: 'welcome',
                requireInteraction: isIOS,
                silent: false
            };
            
            // เพิ่ม badge สำหรับ iOS
            if (isIOS) {
                options.badge = window.location.origin + '/static/images/truck.png';
            }
            
            const welcomeNotification = new Notification('ยินดีต้อนรับสู่ POMPAM!', options);

            setTimeout(() => {
                welcomeNotification.close();
            }, isIOS ? 10000 : 5000); // iOS ให้เวลานานขึ้น
        }
    }

    setupServiceWorker() {
        // Register service worker for better notification handling
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully');
                    
                    // Wait for service worker to be ready
                    return navigator.serviceWorker.ready;
                })
                .then(registration => {
                    console.log('Service Worker is ready');
                    this.serviceWorkerReady = true;
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    createNotificationContainer() {
        // Check if this is iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        const hasPushAPI = 'PushManager' in window;
        
        // Create notification dropdown
        const notificationHTML = `
            <div id="notification-container" class="notification-container">
                ${isIOS && isSafari && !isStandalone && !hasPushAPI ? '<div id="ios-banner" class="ios-banner">📱 สำหรับ iPhone: กดปุ่ม Share แล้วเลือก "Add to Home Screen" เพื่อรับการแจ้งเตือน<button class="ios-banner-close" onclick="document.getElementById(\'ios-banner\').remove()">×</button></div>' : ''}
                <div id="notification-bell" class="notification-bell">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                    <span id="notification-count" class="notification-count">0</span>
                </div>
                <button id="test-notification-btn" class="test-notification-btn">ทดสอบ Noti</button>
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
        const testBtn = document.getElementById('test-notification-btn');
        
        if (bellContainer) {
            bellContainer.style.position = 'fixed';
            bellContainer.style.top = '20px';
            bellContainer.style.right = '20px';
            bellContainer.style.zIndex = '1000';
        }
        
        if (testBtn) {
            testBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 80px;
                z-index: 1000;
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
        }
    }

    showIOSInstructions() {
        const modal = document.createElement('div');
        modal.className = 'ios-instructions-modal';
        modal.innerHTML = `
            <div class="ios-instructions-content">
                <h3>📱 วิธีเปิดการแจ้งเตือนสำหรับ iPhone</h3>
                <div class="ios-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <span class="step-text">ไปที่ Settings > Safari > Advanced > Experimental Features</span>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <span class="step-text">เปิด "Push API" toggle</span>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <span class="step-text">กลับมาที่เว็บไซต์นี้ แล้วกดปุ่ม Share (ล่าง)</span>
                    </div>
                    <div class="step">
                        <span class="step-number">4</span>
                        <span class="step-text">เลือก "Add to Home Screen"</span>
                    </div>
                    <div class="step">
                        <span class="step-number">5</span>
                        <span class="step-text">เปิดแอปจาก Home Screen แล้วกดปุ่ม "ทดสอบ Noti"</span>
                    </div>
                </div>
                <button class="ios-close-btn" onclick="this.parentElement.parentElement.remove()">เข้าใจแล้ว</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    testNotification() {
        console.log('Testing notification...');
        
        // Check if this is iOS Safari and not in standalone mode
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        const hasPushAPI = 'PushManager' in window;
        
        // Debug logging for test notification
        console.log('=== Test Notification Debug ===');
        console.log('isIOS:', isIOS);
        console.log('isSafari:', isSafari);
        console.log('isStandalone:', isStandalone);
        console.log('hasPushAPI:', hasPushAPI);
        console.log('Notification permission:', Notification.permission);
        console.log('Service Worker controller:', navigator.serviceWorker?.controller);
        console.log('===============================');
        
        // For iOS in standalone mode (PWA), always allow testing
        if (isIOS && isStandalone) {
            console.log('iOS PWA mode - proceeding with test notification');
        } else if (isIOS && isSafari && !isStandalone && !hasPushAPI) {
            this.showIOSInstructions();
            return;
        }
        
        // ตรวจสอบ permission ก่อน
        if (Notification.permission === 'granted') {
            this.addNotification(
                'ทดสอบการแจ้งเตือน',
                'นี่คือการทดสอบ notification สำหรับ iPhone 13',
                'test',
                'test-truck-001'
            );
        } else if (Notification.permission === 'default') {
            // ขอ permission ใหม่
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.addNotification(
                        'ทดสอบการแจ้งเตือน',
                        'นี่คือการทดสอบ notification สำหรับ iPhone 13',
                        'test',
                        'test-truck-001'
                    );
                } else {
                    alert('กรุณาอนุญาตการแจ้งเตือนเพื่อทดสอบ');
                }
            });
        } else {
            alert('การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์');
        }
    }

    setupEventListeners() {
        const bell = document.getElementById('notification-bell');
        const dropdown = document.getElementById('notification-dropdown');
        const clearAll = document.getElementById('clear-all');
        const testBtn = document.getElementById('test-notification-btn');

        bell.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        clearAll.addEventListener('click', () => {
            this.clearAllNotifications();
        });

        testBtn.addEventListener('click', () => {
            this.testNotification();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!bell.contains(e.target) && !dropdown.contains(e.target) && !testBtn.contains(e.target)) {
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
        this.saveNotificationsToStorage();
        this.updateNotificationDisplay();
        this.showBrowserNotification(notification);
        this.showToast(notification);
        this.updateNotificationCount();
        this.shakeBell();
    }

    showBrowserNotification(notification) {
        console.log('showBrowserNotification called:', notification);
        console.log('Notification permission:', Notification.permission);
        console.log('Service Worker available:', 'serviceWorker' in navigator);
        console.log('Service Worker controller:', navigator.serviceWorker?.controller);
        console.log('User Agent:', navigator.userAgent);
        
        // Detect iOS Safari and standalone mode
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        
        console.log('=== Notification Context ===');
        console.log('isIOS:', isIOS);
        console.log('isSafari:', isSafari);
        console.log('isStandalone:', isStandalone);
        console.log('============================');
        
        if ('Notification' in window && Notification.permission === 'granted') {
            // For iOS PWA, prefer Service Worker if available, otherwise use direct notification
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                console.log('Using Service Worker for notification');
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    payload: {
                        title: notification.title,
                        body: notification.message,
                        icon: window.location.origin + '/static/images/truck.png',
                        badge: window.location.origin + '/static/images/truck.png',
                        tag: `pompam-${notification.id}`,
                        requireInteraction: isIOS && isStandalone, // iOS PWA ต้องการ interaction
                        renotify: true,
                        silent: false,
                        data: {
                            notificationId: notification.id,
                            truckId: notification.truckId,
                            url: '/map'
                        }
                    }
                });
            } else {
                // Fallback to direct notification
                console.log('Using direct notification for', isIOS ? (isStandalone ? 'iOS PWA' : 'iOS Safari') : 'other platform');
                
                // iOS PWA-specific options
                const options = {
                    body: notification.message,
                    icon: window.location.origin + '/static/images/truck.png',
                    badge: window.location.origin + '/static/images/truck.png',
                    tag: `pompam-${notification.id}`,
                    requireInteraction: isIOS && isStandalone, // iOS PWA ต้องการ user interaction
                    silent: false,
                    renotify: true,
                    data: {
                        notificationId: notification.id,
                        truckId: notification.truckId,
                        url: '/map'
                    }
                };
                
                // เพิ่ม vibrate และ actions เฉพาะ non-iOS
                if (!isIOS) {
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

                try {
                    const browserNotification = new Notification(notification.title, options);
                    console.log('Direct notification created successfully for', isIOS && isStandalone ? 'iOS PWA' : 'other platform');

                    browserNotification.onclick = () => {
                        console.log('Notification clicked');
                        if (isStandalone) {
                            // For PWA, just focus the window
                            window.focus();
                        } else {
                            // For regular browser, navigate to map
                            window.location.href = '/map';
                        }
                        browserNotification.close();
                        this.markAsRead(notification.id);
                    };

                    browserNotification.onshow = () => {
                        console.log('Notification shown successfully');
                    };

                    browserNotification.onerror = (error) => {
                        console.error('Notification error:', error);
                        // For iOS PWA, try alternative approach
                        if (isIOS && isStandalone) {
                            console.log('Trying alternative notification approach for iOS PWA');
                            this.showToast(notification);
                        }
                    };

                    browserNotification.onclose = () => {
                        console.log('Notification closed');
                    };

                    // Auto close after longer time for iOS PWA
                    setTimeout(() => {
                        browserNotification.close();
                    }, isIOS && isStandalone ? 60000 : 30000);
                } catch (error) {
                    console.error('Error creating notification:', error);
                    // Fallback to toast for iOS PWA
                    if (isIOS && isStandalone) {
                        console.log('Fallback to toast notification for iOS PWA');
                        this.showToast(notification);
                    }
                }
            }
        } else if (Notification.permission === 'denied') {
            console.log('การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์');
        } else {
            console.log('Notification permission not granted:', Notification.permission);
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotificationsToStorage();
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
            window.location.href = '/map';
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotificationsToStorage();
        this.updateNotificationDisplay();
        this.updateNotificationCount();
    }

    simulateDeliveryNotifications() {
        // Add initial notification after 3 seconds
        setTimeout(() => {
            const trucks = [
                { id: 'POMPAM-01', name: 'รถป๋อมแป๋ม 01', location: 'ใกล้ตลาดนัดจตุจักร' },
                { id: 'POMPAM-02', name: 'รถป๋อมแป๋ม 02', location: 'ใกล้มหาวิทยาลัยธรรมศาสตร์' },
                { id: 'POMPAM-03', name: 'รถป๋อมแป๋ม 03', location: 'ใกล้เซ็นทรัลเวิลด์' }
            ];
            
            const truck = trucks[Math.floor(Math.random() * trucks.length)];
            this.addNotification(
                '🚛 รถใกล้มาถึงแล้ว!',
                `${truck.name} ${truck.location} - คาดว่าจะมาถึงใน 5-10 นาที`,
                'delivery',
                truck.id
            );
            
            // Start periodic notifications
            this.startPeriodicNotifications();
        }, 3000);
    }
    
    startPeriodicNotifications() {
        const trucks = [
            { id: 'POMPAM-01', name: 'รถป๋อมแป๋ม 01', location: 'ใกล้ตลาดนัดจตุจักร' },
            { id: 'POMPAM-02', name: 'รถป๋อมแป๋ม 02', location: 'ใกล้มหาวิทยาลัยธรรมศาสตร์' },
            { id: 'POMPAM-03', name: 'รถป๋อมแป๋ม 03', location: 'ใกล้เซ็นทรัลเวิลด์' }
        ];
        
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

    // Save notifications to localStorage
    saveNotificationsToStorage() {
        try {
            const notificationsData = this.notifications.map(notification => ({
                ...notification,
                timestamp: notification.timestamp.toISOString() // Convert Date to string
            }));
            localStorage.setItem('pompam_notifications', JSON.stringify(notificationsData));
        } catch (error) {
            console.error('Error saving notifications to localStorage:', error);
        }
    }

    // Load notifications from localStorage
    loadNotificationsFromStorage() {
        try {
            const stored = localStorage.getItem('pompam_notifications');
            if (stored) {
                const notificationsData = JSON.parse(stored);
                this.notifications = notificationsData.map(notification => ({
                    ...notification,
                    timestamp: new Date(notification.timestamp) // Convert string back to Date
                }));
                
                // Remove notifications older than 24 hours
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                this.notifications = this.notifications.filter(notification => 
                    notification.timestamp > oneDayAgo
                );
                
                // Save cleaned notifications back to storage
                if (this.notifications.length !== notificationsData.length) {
                    this.saveNotificationsToStorage();
                }
            }
        } catch (error) {
            console.error('Error loading notifications from localStorage:', error);
            this.notifications = [];
        }
    }

    // Clear old notifications (called periodically)
    clearOldNotifications() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const originalLength = this.notifications.length;
        this.notifications = this.notifications.filter(notification => 
            notification.timestamp > oneDayAgo
        );
        
        if (this.notifications.length !== originalLength) {
            this.saveNotificationsToStorage();
            this.updateNotificationDisplay();
            this.updateNotificationCount();
        }
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