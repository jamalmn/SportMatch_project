import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';

function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-24 bg-sm-gray-100 rounded-2xl w-full" />
      <div className="h-48 bg-sm-gray-100 rounded-2xl w-full" />
    </div>
  );
}

export default function PublicProfilePage() {
  const { id }   = useParams();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const isOwnProfile = user?.id === Number(id) || String(user?.id) === id;

  useEffect(() => {
    if (isOwnProfile) return;
    setLoading(true);
    setError(null);

    api.get(`/api/users/${id}`)
      .then((res) => setProfileUser(res.data))
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, [id, isOwnProfile]);

  if (isOwnProfile) return <Navigate to="/profile" replace />;

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

          {!loading && !error && profileUser && (
            <>
              <ProfileHeader
                user={profileUser}
                isOwnProfile={false}
                onEditClick={() => {}}
              />
              <ProfileTabs userId={id} isOwnProfile={false} />
            </>
          )}

        </div>
      </main>
    </>
  );
}
