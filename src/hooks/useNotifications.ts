import { useState, useEffect, useCallback } from "react";
import { BookingRequest } from "./useBookingRequests";

export interface Notification {
    id: string;
    title: string;
    description: string;
    type: "booking_request";
    data: any;
    isRead: boolean;
    timestamp: Date;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const addNotification = useCallback((request: BookingRequest) => {
        const newNotification: Notification = {
            id: request.id,
            title: "New Booking Request",
            description: `A new booking request from ${request.patient_name} for ${request.service_name} has arrived.`,
            type: "booking_request",
            data: request,
            isRead: false,
            timestamp: new Date(),
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep only last 20
    }, []);

    useEffect(() => {
        const handleNewBooking = (event: any) => {
            addNotification(event.detail);
        };

        window.addEventListener('new-booking-request' as any, handleNewBooking);
        return () => {
            window.removeEventListener('new-booking-request' as any, handleNewBooking);
        };
    }, [addNotification]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
    };
}
