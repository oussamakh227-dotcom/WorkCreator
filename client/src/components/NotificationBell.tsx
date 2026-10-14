import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface Notification {
  id: number;
  notificationType: string;
  fromUserName?: string | null;
  fromUserAvatar?: string | null;
  createdAt: string | Date;
  isRead: boolean;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications
  const { data: notificationsData, refetch } = trpc.social.getUnreadNotifications.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Get unread count
  const { data: countData } = trpc.social.getNotificationCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = trpc.social.markNotificationAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read
  const markAllAsReadMutation = trpc.social.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (notificationsData) {
      setNotifications(notificationsData);
    }
    if (countData) {
      setUnreadCount(countData);
    }
  }, [notificationsData, countData]);

  const handleNotificationClick = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.notificationType) {
      case "follow":
        return `${notification.fromUserName} started following you`;
      case "like":
        return `${notification.fromUserName} liked your post`;
      case "comment":
        return `${notification.fromUserName} commented on your post`;
      case "share":
        return `${notification.fromUserName} shared your post`;
      default:
        return "New notification";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return "👤";
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "share":
        return "🔄";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-700 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-300 hover:text-white" />

          {/* Badge with unread count */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px] animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    notification.isRead
                      ? "bg-slate-800 hover:bg-slate-750"
                      : "bg-slate-700/50 hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar or Icon */}
                    <div className="flex-shrink-0">
                      {notification.fromUserAvatar ? (
                        <img
                          src={notification.fromUserAvatar}
                          alt={notification.fromUserName || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm">
                          {getNotificationIcon(notification.notificationType)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <p className="text-sm text-gray-200 truncate">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-gray-300 hover:bg-slate-700 w-full"
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Notification Badge Component (Standalone)
 * Can be used independently to show notification count
 */
export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px] animate-pulse">
      {count > 99 ? "99+" : count}
    </span>
  );
}
