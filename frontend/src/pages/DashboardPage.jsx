import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import UpcomingEventsScroll from '../components/dashboard/UpcomingEventsScroll';
import MyOrganizedEvents from '../components/dashboard/MyOrganizedEvents';
import RecommendedEvents from '../components/dashboard/RecommendedEvents';
import NotificationsPanel from '../components/dashboard/NotificationsPanel';
import ActivitySummary from '../components/dashboard/ActivitySummary';

export default function DashboardPage() {
  const { user } = useAuth();

  const [upcomingEvents,        setUpcomingEvents]        = useState([]);
  const [loadingUpcoming,       setLoadingUpcoming]       = useState(true);

  const [myEvents,              setMyEvents]              = useState([]);
  const [loadingMyEvents,       setLoadingMyEvents]       = useState(true);

  const [recommended,           setRecommended]           = useState([]);
  const [loadingRecommended,    setLoadingRecommended]    = useState(true);

  const [notifications,         setNotifications]         = useState([]);
  const [noLeidas,              setNoLeidas]              = useState(0);
  const [loadingNotifications,  setLoadingNotifications]  = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    /* All requests fire in parallel; each resolves its own loading state */

    api.get('/api/users/me/inscriptions?estado=confirmed&periodo=proximos&limit=5')
      .then(res  => setUpcomingEvents(res.data.inscriptions ?? []))
      .catch(() => setUpcomingEvents([]))
      .finally(() => setLoadingUpcoming(false));

    api.get(`/api/users/${user.id}/events?limit=3`)
      .then(res  => setMyEvents(res.data.events ?? []))
      .catch(() => setMyEvents([]))
      .finally(() => setLoadingMyEvents(false));

    const deportesFav = user.deportes_favoritos ?? [];
    const recUrl = deportesFav.length > 0
      ? `/api/events?deporte=${encodeURIComponent(deportesFav[0])}&limit=4`
      : '/api/events?limit=4';
    api.get(recUrl)
      .then(res  => setRecommended(res.data.events ?? []))
      .catch(() => setRecommended([]))
      .finally(() => setLoadingRecommended(false));

    api.get('/api/notifications?limit=4')
      .then(res => {
        setNotifications(res.data.notifications ?? []);
        setNoLeidas(res.data.no_leidas ?? 0);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifications(false));

  }, [user?.id]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sm-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-5 space-y-4 lg:space-y-0">

            {/* ── Left column ──────────────────────────────────────────── */}
            <div className="space-y-4">
              <WelcomeBanner
                user={user}
                upcomingCount={upcomingEvents.length}
                unreadCount={noLeidas}
              />
              <UpcomingEventsScroll
                events={upcomingEvents}
                loading={loadingUpcoming}
              />
              <MyOrganizedEvents
                events={myEvents}
                loading={loadingMyEvents}
              />
              <RecommendedEvents
                events={recommended}
                loading={loadingRecommended}
                userSports={user?.deportes_favoritos ?? []}
              />
              {/* Notificaciones: solo visible en móvil (en md+ el icono de la navbar navega a /notifications) */}
              <div className="md:hidden">
                <NotificationsPanel
                  notifications={notifications}
                  loading={loadingNotifications}
                  unreadCount={noLeidas}
                  onUnreadChange={setNoLeidas}
                />
              </div>
            </div>

            {/* ── Right column (sticky) ─────────────────────────────────── */}
            <div className="hidden lg:block">
              <div className="lg:sticky lg:top-20 space-y-4">
                <NotificationsPanel
                  notifications={notifications}
                  loading={loadingNotifications}
                  unreadCount={noLeidas}
                  onUnreadChange={setNoLeidas}
                />
                <ActivitySummary user={user} />
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
