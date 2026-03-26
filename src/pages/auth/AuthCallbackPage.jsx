import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';

const AuthCallbackPage = () => {
    const [status, setStatus] = useState('Verifying your account...');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // 1. Exchange selection code for session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) throw sessionError;
                if (!session) {
                    throw new Error('No session found');
                }

                const user = session.user;
                const email = user.email;
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
                const firstName = fullName.split(' ')[0];
                const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

                // 2. Sync user profile using UPSERT (Avoids 23505 duplicate key errors)
                setStatus('Syncing your profile...');
                const uniqueUsername = `${firstName.toLowerCase()}${Math.floor(Math.random() * 10000)}`;
                
                const { error: upsertError } = await supabase
                    .from('users')
                    .upsert({
                        id: user.id,
                        email: email,
                        full_name: fullName,
                        avatar_url: avatarUrl,
                        username: uniqueUsername, // Only takes effect on real INSERT
                        plan: 'free',
                        last_seen: new Date().toISOString()
                    }, { 
                        onConflict: 'id', 
                        ignoreDuplicates: false // We want last_seen to update
                    });

                if (upsertError) throw upsertError;

                // 3. Ensure auth metadata is updated (Non-blocking)
                supabase.auth.updateUser({
                    data: { first_name: firstName, avatar_url: avatarUrl }
                }).catch(() => {});

                // 4. Decide where to go based on Projects
                setStatus('Loading your workspace...');
                const { data: project } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle();

                if (project) {
                    sessionStorage.setItem('welcome_toast', `Welcome back ${firstName}!`);
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/onboarding', { replace: true });
                }

            } catch (err) {
                console.error('Auth Callback Error:', err);
                const errorMsg = err.details || err.hint || err.message || 'Authentication failed';
                setError(errorMsg);
                setTimeout(() => {
                    navigate('/login?error=auth_failed', { replace: true });
                }, 3000);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm glass-card p-8 text-center animate-slide-up">
                {error ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                            <AlertCircle size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Authentication Failed</h2>
                        <p className="text-muted text-sm">{error}</p>
                        <p className="text-xs text-muted/60 mt-2">Redirecting you back to login...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-accent/20 rounded-full"></div>
                            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">Authenticating</h2>
                            <p className="text-muted text-sm animate-pulse">{status}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallbackPage;
