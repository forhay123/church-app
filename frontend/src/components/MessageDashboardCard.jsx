import React, { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, Bell, AlertCircle, CheckCircle } from "lucide-react";
import { fetchInbox, fetchUserProfile } from "../utils/api";

export default function MessageDashboardCard() {
  const [loading, setLoading] = useState(true);
  const [acknowledgedCount, setAcknowledgedCount] = useState(0);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMessageData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!user || !user.user_id || !user.role) {
          setError("User not found. Please log in again.");
          setLoading(false);
          return;
        }

        const userProfile = await fetchUserProfile();
        const allMessages = await fetchInbox();
        const userName = userProfile.name;
        
        const newAcknowledged = allMessages.filter(message =>
          message.responses.some(
            (response) => response.responder === userName && response.acknowledged
          )
        ).length;

        const newUnacknowledged = allMessages.filter(message => {
          const isRecipient = message.receiver_roles.includes(user.role);
          if (!isRecipient) return false;

          const hasAcknowledged = message.responses.some(
            (response) => response.responder === userName && response.acknowledged
          );

          return isRecipient && !hasAcknowledged;
        }).length;
        
        setAcknowledgedCount(newAcknowledged);
        setUnacknowledgedCount(newUnacknowledged);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    loadMessageData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card p-6">
        <div className="flex items-center space-x-4">
          <div className="dashboard-card-icon animate-pulse">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-6 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 border-error/20 bg-gradient-to-r from-error/5 to-error/10">
        <div className="flex items-center space-x-4">
          <div className="dashboard-card-icon bg-gradient-to-br from-error/20 to-error/10 text-error">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Messages</p>
            <p className="font-bold text-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasUnacknowledged = unacknowledgedCount > 0;

  return (
    <div className={`dashboard-card p-6 ${
      hasUnacknowledged 
        ? 'border-warning/20 bg-gradient-to-r from-warning/5 to-warning/10' 
        : 'border-success/20 bg-gradient-to-r from-success/5 to-success/10'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`dashboard-card-icon ${
            hasUnacknowledged
              ? 'bg-gradient-to-br from-warning/20 to-warning/10 text-warning'
              : 'bg-gradient-to-br from-success/20 to-success/10 text-success'
          }`}>
            {hasUnacknowledged ? (
              <Bell className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Message Status</p>
            <div className="flex items-center space-x-4">
              <div>
                <p className="font-bold text-2xl text-card-foreground">{unacknowledgedCount}</p>
                <p className="text-xs text-muted-foreground">Unacknowledged</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div>
                <p className="font-semibold text-lg text-muted-foreground">{acknowledgedCount}</p>
                <p className="text-xs text-muted-foreground">Acknowledged</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          {hasUnacknowledged ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning/10 text-warning border border-warning/20">
              <AlertCircle className="w-3 h-3 mr-1" />
              Action Required
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success border border-success/20">
              <ThumbsUp className="w-3 h-3 mr-1" />
              All Clear
            </div>
          )}
        </div>
      </div>
      
      {hasUnacknowledged && (
        <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/10">
          <p className="text-sm text-warning font-medium">
            You have {unacknowledgedCount} message{unacknowledgedCount > 1 ? 's' : ''} requiring your acknowledgment.
          </p>
        </div>
      )}
    </div>
  );
}