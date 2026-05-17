import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

export default function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onChange' });

  const onSubmit = async (data) => {
    setGlobalError('');
    setIsLoading(true);
    try {
      const res = await authService.login(data.email, data.password);
      login(res.data.user, res.data.token, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setGlobalError('Email o contraseña incorrectos');
      } else {
        setGlobalError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-5">
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
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
              errors.email
                ? 'border-red-400 bg-red-50 focus:border-red-500'
                : 'border-sm-gray-200 focus:border-sm-green-500'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-sm-gray-700">
              Contraseña
            </label>
            <button
              type="button"
              className="text-xs text-sm-green-500 hover:text-sm-green-600"
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'La contraseña es obligatoria',
              })}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none transition-colors ${
                errors.password
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-sm-gray-200 focus:border-sm-green-500'
              }`}
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
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-sm-gray-500">
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => onSwitch('register')}
          className="text-sm-green-500 font-semibold hover:text-sm-green-600"
        >
          Créala gratis →
        </button>
      </p>
    </form>
  );
}
