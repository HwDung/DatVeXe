import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/api';

const NotificationContext = createContext();

const STORAGE_KEY_NOTIFS = 'datvexe_notifications';
const STORAGE_KEY_BOOKINGS = 'datvexe_my_saved_bookings';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedBookings, setSavedBookings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeToast, setActiveToast] = useState(null);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  // Sync saved bookings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(savedBookings));
    } catch (e) {
      console.error('Failed to save bookings', e);
    }
  }, [savedBookings]);

  const addNotification = useCallback((notif) => {
    const item = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: notif.title || 'Thông báo',
      message: notif.message || '',
      type: notif.type || 'info', // 'info' | 'success' | 'warning' | 'danger'
      link: notif.link || null,
      bookingCode: notif.bookingCode || null,
      isRead: false,
      timestamp: notif.timestamp || new Date().toISOString(),
    };

    setNotifications((prev) => [item, ...prev.slice(0, 49)]); // Giữ tối đa 50 thông báo

    // Trigger toast
    setActiveToast(item);
    setTimeout(() => {
      setActiveToast((current) => (current?.id === item.id ? null : current));
    }, 5000);
  }, []);

  const addSavedBooking = useCallback((booking) => {
    if (!booking || !booking.bookingCode) return;
    setSavedBookings((prev) => {
      const exists = prev.find((b) => b.bookingCode === booking.bookingCode);
      if (exists) {
        return prev.map((b) =>
          b.bookingCode === booking.bookingCode ? { ...b, ...booking } : b
        );
      }
      return [
        {
          id: booking.id,
          bookingCode: booking.bookingCode,
          passengerName: booking.passengerName,
          passengerPhone: booking.passengerPhone,
          status: booking.status || 'pending',
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice,
          seatCode: booking.seatCode,
          tripDate: booking.tripDate,
          origin: booking.trip?.route?.origin,
          destination: booking.trip?.route?.destination,
          company: booking.trip?.company?.name,
          departureTime: booking.trip?.departureTime,
          createdAt: booking.createdAt || new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Background status check for user bookings: detects when Admin approves ticket
  useEffect(() => {
    if (savedBookings.length === 0) return;

    const checkStatus = async () => {
      try {
        const codes = savedBookings.map((b) => b.bookingCode);
        const res = await bookingService.statusCheck(codes);
        const latestList = res.data;

        if (!Array.isArray(latestList)) return;

        setSavedBookings((currentBookings) => {
          let hasChanges = false;
          const updatedBookings = currentBookings.map((local) => {
            const remote = latestList.find((r) => r.bookingCode === local.bookingCode);
            if (!remote) return local;

            // Check if status changed
            if (remote.status !== local.status) {
              hasChanges = true;
              const routeText = remote.trip?.route
                ? `${remote.trip.route.origin} → ${remote.trip.route.destination}`
                : '';

              if (local.status === 'pending' && remote.status === 'confirmed') {
                addNotification({
                  title: 'Vé đã được duyệt! 🎉',
                  message: `Đơn vé ${local.bookingCode} ${routeText ? `(${routeText})` : ''} đã được Ban quản trị phê duyệt. Chúc bạn có chuyến đi thuận lợi!`,
                  type: 'success',
                  link: `/lookup?code=${local.bookingCode}`,
                  bookingCode: local.bookingCode,
                });
              } else if (remote.status === 'cancelled' && local.status !== 'cancelled') {
                addNotification({
                  title: 'Vé đã bị hủy ⚠️',
                  message: `Đơn vé ${local.bookingCode} ${routeText ? `(${routeText})` : ''} đã bị hủy bởi hệ thống.`,
                  type: 'danger',
                  link: `/lookup?code=${local.bookingCode}`,
                  bookingCode: local.bookingCode,
                });
              } else if (remote.status === 'completed' && local.status !== 'completed') {
                addNotification({
                  title: 'Chuyến đi hoàn thành ✨',
                  message: `Chuyến xe mã ${local.bookingCode} đã kết thúc. Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!`,
                  type: 'info',
                  link: `/lookup?code=${local.bookingCode}`,
                  bookingCode: local.bookingCode,
                });
              }

              return {
                ...local,
                status: remote.status,
                paymentStatus: remote.paymentStatus,
              };
            }
            return local;
          });

          return hasChanges ? updatedBookings : currentBookings;
        });
      } catch (err) {
        // Silently ignore background polling errors
      }
    };

    // Check once immediately, then poll every 20 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, [savedBookings, addNotification]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        addSavedBooking,
        savedBookings,
        markAsRead,
        markAllAsRead,
        clearAll,
        activeToast,
        dismissToast: () => setActiveToast(null),
      }}
    >
      {children}
      {/* Floating Toast Notification */}
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            borderLeft: `5px solid ${
              activeToast.type === 'success'
                ? '#10B981'
                : activeToast.type === 'danger'
                ? '#EF4444'
                : activeToast.type === 'warning'
                ? '#F59E0B'
                : '#3B82F6'
            }`,
            padding: '16px 20px',
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'slideInRight 0.3s ease',
          }}
        >
          <div style={{ fontSize: '22px', lineHeight: 1 }}>
            {activeToast.type === 'success' && <i className="bi bi-check-circle-fill" style={{ color: '#10B981' }} />}
            {activeToast.type === 'danger' && <i className="bi bi-x-circle-fill" style={{ color: '#EF4444' }} />}
            {activeToast.type === 'warning' && <i className="bi bi-exclamation-circle-fill" style={{ color: '#F59E0B' }} />}
            {activeToast.type === 'info' && <i className="bi bi-bell-fill" style={{ color: '#3B82F6' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>
              {activeToast.title}
            </div>
            <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.4' }}>
              {activeToast.message}
            </div>
            {activeToast.link && (
              <a
                href={activeToast.link}
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#DC2626',
                  textDecoration: 'none',
                }}
              >
                Xem chi tiết vé →
              </a>
            )}
          </div>
          <button
            onClick={() => setActiveToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '0',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
