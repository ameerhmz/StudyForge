import { useEffect, useRef } from 'react';
import { trackActivity } from '../lib/api';
import useAuthStore from '../store/useAuthStore';

/**
 * Hook to track user activity (heartbeat)
 * Sends a heartbeat every 60 seconds if the user is authenticated
 */
export default function useActivityTracker() {
    const { user } = useAuthStore();
    const intervalRef = useRef(null);
    const lastTrackTimeRef = useRef(Date.now());

    useEffect(() => {
        // Only track if user is logged in
        if (!user) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Start heartbeat interval (every 60 seconds)
        if (!intervalRef.current) {
            console.log('⏱️ Activity tracker started');

            intervalRef.current = setInterval(async () => {
                try {
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - lastTrackTimeRef.current) / 1000);

                    // Only track if at least 50 seconds passed (to prevent double-firing)
                    if (elapsedSeconds >= 50) {
                        await trackActivity(elapsedSeconds);
                        lastTrackTimeRef.current = now;
                        console.log(`💓 Activity heartbeat: ${elapsedSeconds}s trackled`);
                    }
                } catch (error) {
                    console.error('Failed to send activity heartbeat:', error);
                }
            }, 60000); // Check every minute
        }

        // Cleanup on unmount or user logout
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                console.log('⏱️ Activity tracker stopped');
            }
        };
    }, [user]);
}
