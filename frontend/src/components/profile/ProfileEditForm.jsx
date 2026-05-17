import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const INPUT_BASE =
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-sm-dark placeholder:text-sm-gray-300 outline-none transition-colors';
const INPUT_NORMAL =
  `${INPUT_BASE} border-sm-gray-200 focus:border-sm-green-500 focus:ring-2 focus:ring-sm-green-100`;
const INPUT_ERROR =
  `${INPUT_BASE} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100`;

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-sm-gray-600 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function ProfileEditForm({ user, onSave, onCancel }) {
  const { token, login } = useAuth();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      nombre:    user.nombre    ?? '',
      apellidos: user.apellidos ?? '',
      ubicacion: user.ubicacion ?? '',
      nivel:     user.nivel     ?? 'principiante',
      bio:       user.bio       ?? '',
    },
  });

  const bioLength = (watch('bio') ?? '').length;

  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      const res = await api.put('/api/users/me', {
        nombre:    data.nombre,
        apellidos: data.apellidos,
        ubicacion: data.ubicacion || null,
        nivel:     data.nivel,
        bio:       data.bio || null,
      });
      const updatedUser = res.data.user ?? res.data;
      login(updatedUser, token);
      toast.success('Perfil actualizado.');
      onSave(updatedUser);
    } catch (err) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? 'Error al guardar los cambios. Inténtalo de nuevo.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-6 space-y-5">
      <h2 className="font-heading font-semibold text-sm-dark text-base">Editar perfil</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Nombre + Apellidos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Nombre</Label>
            <input
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              placeholder="Jamal"
              className={errors.nombre ? INPUT_ERROR : INPUT_NORMAL}
            />
            <FieldError message={errors.nombre?.message} />
          </div>
          <div>
            <Label required>Apellidos</Label>
            <input
              {...register('apellidos', { required: 'Los apellidos son obligatorios' })}
              placeholder="García López"
              className={errors.apellidos ? INPUT_ERROR : INPUT_NORMAL}
            />
            <FieldError message={errors.apellidos?.message} />
          </div>
        </div>

        {/* Ciudad */}
        <div>
          <Label>Ciudad</Label>
          <input
            {...register('ubicacion')}
            placeholder="Madrid"
            className={INPUT_NORMAL}
          />
        </div>

        {/* Nivel */}
        <div>
          <Label>Nivel</Label>
          <select
            {...register('nivel')}
            className={INPUT_NORMAL}
          >
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </div>

        {/* Bio */}
        <div>
          <Label>Bio</Label>
          <textarea
            {...register('bio', {
              maxLength: { value: 300, message: 'Máximo 300 caracteres' },
            })}
            rows={4}
            placeholder="Cuéntanos algo sobre ti..."
            className={`${errors.bio ? INPUT_ERROR : INPUT_NORMAL} resize-none`}
          />
          <div className="flex justify-between items-start mt-0.5">
            <FieldError message={errors.bio?.message} />
            <span className={`text-xs ml-auto ${bioLength > 280 ? 'text-amber-500' : 'text-sm-gray-300'}`}>
              {bioLength}/300
            </span>
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold text-sm-gray-600 hover:bg-sm-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-full bg-sm-green-500 hover:bg-sm-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </form>
    </div>
  );
}
