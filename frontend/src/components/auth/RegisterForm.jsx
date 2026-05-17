import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import PasswordStrength from './PasswordStrength';
import SportChips from './SportChips';

export default function RegisterForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSports, setSelectedSports] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({ mode: 'onChange' });

  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setGlobalError('');
    setIsLoading(true);
    try {
      const res = await authService.register({
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        password: data.password,
        ciudad: data.ciudad,
        nivel: data.nivel,
        deportes_favoritos: selectedSports,
      });
      login(res.data.user, res.data.token, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('email', { message: 'Este email ya está registrado' });
      } else if (err.response?.status === 400) {
        setGlobalError(err.response.data?.message ?? 'Datos inválidos. Revisa el formulario.');
      } else {
        setGlobalError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
      hasError
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-sm-gray-200 focus:border-sm-green-500'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-5">
        {/* Nombre + Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sm-gray-700 mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              placeholder="Juan"
              className={inputClass(errors.nombre)}
            />
            {errors.nombre && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.nombre.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-sm-gray-700 mb-1.5">
              Apellidos
            </label>
            <input
              type="text"
              {...register('apellidos', { required: 'Los apellidos son obligatorios' })}
              placeholder="García López"
              className={inputClass(errors.apellidos)}
            />
            {errors.apellidos && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.apellidos.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-sm-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'El email es obligatorio',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Formato de email inválido',
              },
            })}
            placeholder="tu@email.com"
            className={inputClass(errors.email)}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>

        {/* Contraseña + fortaleza */}
        <div>
          <label className="block text-sm font-medium text-sm-gray-700 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
              placeholder="••••••••"
              className={inputClass(errors.password).replace('w-full', 'w-full pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm-gray-400 hover:text-sm-gray-600 text-base"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.password.message}
            </p>
          )}
          <PasswordStrength password={passwordValue} />
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-medium text-sm-gray-700 mb-1.5">
            Ciudad
          </label>
          <input
            type="text"
            {...register('ciudad')}
            placeholder="Madrid"
            className={inputClass(false)}
          />
          <p className="mt-1 text-xs text-sm-gray-400">
            Para mostrarte eventos cercanos
          </p>
        </div>

        {/* Nivel deportivo */}
        <div>
          <label className="block text-sm font-medium text-sm-gray-700 mb-1.5">
            Nivel deportivo
          </label>
          <select
            {...register('nivel')}
            className="w-full px-4 py-2.5 rounded-xl border border-sm-gray-200 focus:border-sm-green-500 text-sm outline-none transition-colors bg-white"
          >
            <option value="">Selecciona tu nivel</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>

        {/* Deportes favoritos */}
        <div>
          <label className="block text-sm font-medium text-sm-gray-700 mb-2">
            Deportes favoritos
          </label>
          <SportChips selected={selectedSports} onChange={setSelectedSports} />
        </div>

        {/* Banner de error global */}
        {globalError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-sm-green-500 hover:bg-sm-green-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-sm-gray-500">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="text-sm-green-500 font-semibold hover:text-sm-green-600"
        >
          Inicia sesión →
        </button>
      </p>
    </form>
  );
}
