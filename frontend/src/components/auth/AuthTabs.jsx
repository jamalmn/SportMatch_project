export default function AuthTabs({ activeTab, onSwitch }) {
  return (
    <div className="flex p-1 rounded-[14px] bg-sm-gray-100 mb-8">
      {['login', 'register'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSwitch(tab)}
            className={`flex-1 py-2 text-sm rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-sm-green-500 text-white font-semibold shadow-sm'
                : 'text-sm-gray-500 hover:bg-sm-gray-200 font-medium'
            }`}
          >
            {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        );
      })}
    </div>
  );
}
