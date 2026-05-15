import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import ProfileTabs from '../components/profile/ProfileTabs';

function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-24 bg-sm-gray-100 rounded-2xl w-full" />
      <div className="h-48 bg-sm-gray-100 rounded-2xl w-full" />
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [inscriptions, setInscriptions] = useState([]);
  const [ratings, setRatings]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get('/api/users/me/inscriptions?limit=3'),
      api.get(`/api/ratings?valorado_id=${user.id}&limit=3`),
    ])
      .then(([insRes, ratRes]) => {
        setInscriptions(insRes.data.inscriptions ?? []);
        setRatings(ratRes.data.ratings ?? []);
      })
      .catch(() => setError('No se pudo cargar la información del perfil.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sm-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">

          {loading && <SkeletonProfile />}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && user && (
            <>
              {showEditForm ? (
                <ProfileEditForm
                  user={user}
                  onSave={() => setShowEditForm(false)}
                  onCancel={() => setShowEditForm(false)}
                />
              ) : (
                <ProfileHeader
                  user={user}
                  isOwnProfile
                  onEditClick={() => setShowEditForm(true)}
                />
              )}

              <ProfileTabs userId={user.id} isOwnProfile />
            </>
          )}

        </div>
      </main>
    </>
  );
}
