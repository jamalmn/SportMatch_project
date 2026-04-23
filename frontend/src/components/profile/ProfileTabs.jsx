import { useState } from 'react';
import EventHistoryList from './EventHistoryList';
import RatingsList from './RatingsList';

const TABS = [
  { id: 'participated', label: 'Eventos participados' },
  { id: 'organized',    label: 'Eventos organizados' },
  { id: 'ratings',      label: 'Valoraciones' },
];

export default function ProfileTabs({ userId, isOwnProfile }) {
  const [activeTab, setActiveTab] = useState('participated');
  const [loaded, setLoaded]       = useState({ participated: true });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setLoaded(prev => ({ ...prev, [tabId]: true }));
  };

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden">

      {/* Tab bar */}
      <div className="flex border-b border-sm-gray-200">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`
              flex-1 px-3 py-3.5 text-xs font-semibold transition-colors relative
              ${activeTab === id
                ? 'text-sm-green-600'
                : 'text-sm-gray-400 hover:text-sm-gray-600'
              }
            `}
          >
            {label}
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sm-green-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab panels — render only if the tab has been activated at least once */}
      <div>
        {loaded.participated && (
          <div className={activeTab === 'participated' ? '' : 'hidden'}>
            <EventHistoryList
              type="participated"
              userId={userId}
              isOwnProfile={isOwnProfile}
            />
          </div>
        )}

        {loaded.organized && (
          <div className={activeTab === 'organized' ? '' : 'hidden'}>
            <EventHistoryList
              type="organized"
              userId={userId}
              isOwnProfile={isOwnProfile}
            />
          </div>
        )}

        {loaded.ratings && (
          <div className={activeTab === 'ratings' ? '' : 'hidden'}>
            <RatingsList userId={userId} />
          </div>
        )}
      </div>

    </div>
  );
}
