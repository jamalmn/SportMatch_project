import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import SportSelector from './SportSelector';
import NivelSelector from './NivelSelector';
import LocationPicker from './LocationPicker';
import EventPreviewCard from './EventPreviewCard';
import ValidationChecklist from './ValidationChecklist';

/* ── Shared field styles ────────────────────────────────────────────────── */

const INPUT_BASE =
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-sm-dark placeholder:text-sm-gray-300 outline-none transition-colors';
const INPUT_NORMAL =
  `${INPUT_BASE} border-sm-gray-200 focus:border-sm-green-500 focus:ring-2 focus:ring-sm-green-100`;
const INPUT_ERROR =
  `${INPUT_BASE} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100`;

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-sm-gray-600 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-heading font-semibold text-sm-dark text-base">{title}</h2>
      {children}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function EventForm({ mode = 'create', eventId, defaultValues }) {
  const navigate   = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      titulo:       '',
      descripcion:  '',
      sport:        '',
      fecha:        '',
      hora:         '',
      duracion:     60,
      aforo_maximo: 10,
      nivel:        '',
      location:     { direccion: '', lat: null, lng: null },
    },
  });

  /* Populate form when editing */
  useEffect(() => {
    if (mode === 'edit' && defaultValues) {
      const dt = defaultValues.fecha_hora ? new Date(defaultValues.fecha_hora) : null;
      const pad = n => String(n).padStart(2, '0');
      reset({
        titulo:       defaultValues.titulo       ?? '',
        descripcion:  defaultValues.descripcion  ?? '',
        sport:        defaultValues.deporte       ?? '',
        fecha:        dt ? `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}` : '',
        hora:         dt ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : '',
        duracion:     defaultValues.duracion_minutos ?? 60,
        aforo_maximo: defaultValues.aforo_maximo  ?? 10,
        nivel:        defaultValues.nivel_requerido ?? '',
        location: {
          direccion: defaultValues.direccion    ?? '',
          lat:       defaultValues.ubicacion_lat ?? null,
          lng:       defaultValues.ubicacion_lng ?? null,
        },
      });
    }
  }, [mode, defaultValues, reset]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      const fecha_hora = new Date(`${data.fecha}T${data.hora}`).toISOString();
      const payload = {
        titulo:            data.titulo,
        descripcion:       data.descripcion,
        deporte:           data.sport,
        fecha_hora,
        duracion_minutos:  Number(data.duracion),
        aforo_maximo:      Number(data.aforo_maximo),
        nivel_requerido:   data.nivel,
        direccion:         data.location.direccion,
        ubicacion_lat:     Number(data.location.lat),
        ubicacion_lng:     Number(data.location.lng),
      };

      if (mode === 'create') {
        const res = await api.post('/api/events', payload);
        toast.success('Evento creado correctamente.');
        navigate(`/events/${res.data.event.id}`);
      } else {
        await api.put(`/api/events/${eventId}`, payload);
        toast.success('Cambios guardados.');
        navigate(`/events/${eventId}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? 'Error al guardar el evento. Inténtalo de nuevo.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  /* Called by RHF when submit is blocked by validation errors.
     Receives the errors object so we can log and scroll to the first failure. */
  const onError = (validationErrors) => {
    console.log('[EventForm] Errores de validación RHF:', validationErrors);
    toast.warning('Revisa los campos marcados en rojo antes de continuar.', {
      toastId: 'form-validation-error',
    });
    // Wait two animation frames so React has committed the error <p> elements
    // to the DOM before we try to scroll to them.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const firstErrorEl = document.querySelector('p.text-red-500');
        firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
    );
  };

  const watchedValues = watch();

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 space-y-4 lg:space-y-0">

        {/* ── Left column: form sections ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Basic info */}
          <SectionCard title="Información básica">
            <div>
              <Label required>Título</Label>
              <input
                {...register('titulo', {
                  required: 'El título es obligatorio',
                  minLength: { value: 5,   message: 'Mínimo 5 caracteres' },
                  maxLength: { value: 150, message: 'Máximo 150 caracteres' },
                })}
                placeholder="Partido de fútbol en el parque"
                className={errors.titulo ? INPUT_ERROR : INPUT_NORMAL}
              />
              <FieldError message={errors.titulo?.message} />
            </div>

            <div>
              <Label required>Descripción</Label>
              <textarea
                {...register('descripcion', {
                  required: 'La descripción es obligatoria',
                  minLength: { value: 10,   message: 'Mínimo 10 caracteres' },
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                })}
                rows={4}
                placeholder="Describe el evento, qué se necesita, nivel mínimo..."
                className={`${errors.descripcion ? INPUT_ERROR : INPUT_NORMAL} resize-none`}
              />
              <div className="flex justify-between items-start">
                <FieldError message={errors.descripcion?.message} />
                <span className="text-xs text-sm-gray-300 ml-auto mt-1">
                  {(watch('descripcion') ?? '').length}/2000
                </span>
              </div>
            </div>

            <div>
              <Label required>Deporte</Label>
              <Controller
                name="sport"
                control={control}
                rules={{ required: 'Selecciona un deporte' }}
                render={({ field }) => (
                  <SportSelector
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.sport?.message}
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* Date & time */}
          <SectionCard title="Fecha y hora">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Fecha</Label>
                <input
                  type="date"
                  {...register('fecha', {
                    required: 'La fecha es obligatoria',
                    validate: v => {
                      // In edit mode the backend validates the date; skip here
                      // to avoid false blocks on events that passed without auto-finalization.
                      if (mode === 'edit') return true;
                      if (!v) return true;
                      const hora = watch('hora');
                      const dt = new Date(`${v}T${hora || '00:00'}`);
                      return dt > new Date() || 'La fecha debe ser futura';
                    },
                  })}
                  className={errors.fecha ? INPUT_ERROR : INPUT_NORMAL}
                />
                <FieldError message={errors.fecha?.message} />
              </div>
              <div>
                <Label required>Hora</Label>
                <input
                  type="time"
                  {...register('hora', { required: 'La hora es obligatoria' })}
                  className={errors.hora ? INPUT_ERROR : INPUT_NORMAL}
                />
                <FieldError message={errors.hora?.message} />
              </div>
            </div>

            <div>
              <Label required>Duración (minutos)</Label>
              <input
                type="number"
                {...register('duracion', {
                  required: 'La duración es obligatoria',
                  min: { value: 15, message: 'Mínimo 15 minutos' },
                  max: { value: 480, message: 'Máximo 480 minutos' },
                })}
                placeholder="90"
                className={errors.duracion ? INPUT_ERROR : INPUT_NORMAL}
              />
              <FieldError message={errors.duracion?.message} />
            </div>
          </SectionCard>

          {/* Capacity & level */}
          <SectionCard title="Plazas y nivel">
            <div>
              <Label required>Aforo máximo</Label>
              <input
                type="number"
                {...register('aforo_maximo', {
                  required: 'El aforo es obligatorio',
                  min: { value: 2, message: 'Mínimo 2 participantes' },
                  max: { value: 500, message: 'Máximo 500 participantes' },
                })}
                placeholder="10"
                className={errors.aforo_maximo ? INPUT_ERROR : INPUT_NORMAL}
              />
              <FieldError message={errors.aforo_maximo?.message} />
            </div>

            <div>
              <Label required>Nivel requerido</Label>
              <Controller
                name="nivel"
                control={control}
                rules={{ required: 'Selecciona un nivel' }}
                render={({ field }) => (
                  <NivelSelector
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.nivel?.message}
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard title="Ubicación">
            <Controller
              name="location"
              control={control}
              rules={{
                validate: v =>
                  (v?.lat != null && v?.lng != null && !!v?.direccion)
                    || 'Busca una dirección o arrastra el marcador en el mapa',
              }}
              render={({ field }) => (
                <LocationPicker
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.location?.message}
                />
              )}
            />
          </SectionCard>

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

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-full bg-sm-green-500 text-white font-semibold text-sm hover:bg-sm-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? (mode === 'create' ? 'Creando...' : 'Guardando...')
              : (mode === 'create' ? 'Crear evento' : 'Guardar cambios')
            }
          </button>
        </div>

        {/* ── Right column: preview + checklist ──────────────────────── */}
        <div className="hidden lg:block">
          <div className="lg:sticky lg:top-20 space-y-4">
            <p className="text-xs font-semibold text-sm-gray-400 uppercase tracking-wide px-1">Vista previa</p>
            <EventPreviewCard
              titulo={watchedValues.titulo}
              sport={watchedValues.sport}
              nivel={watchedValues.nivel}
              fecha={watchedValues.fecha}
              hora={watchedValues.hora}
              direccion={watchedValues.location?.direccion}
              aforoMaximo={watchedValues.aforo_maximo}
            />
            <ValidationChecklist watch={watchedValues} errors={errors} />
          </div>
        </div>

      </div>
    </form>
  );
}
