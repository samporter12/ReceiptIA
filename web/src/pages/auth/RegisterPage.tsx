import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../store/AuthContext';
import { Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await registerUser(data.email, data.password, data.fullName);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.response?.data?.error || 'Error al registrarse';
      setServerError(msg);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-success" />
          </div>
          <h2 className="text-2xl font-black text-text-primary">¡Revisa tu email!</h2>
          <p className="text-text-secondary mt-2">
            Te enviamos un link de confirmación. Confirma tu cuenta y luego inicia sesión.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-6 w-full py-3">
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-text-primary">Crea tu cuenta</h1>
          <p className="text-text-secondary text-sm mt-1">Gratis • Sin tarjeta de crédito</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Nombre completo</label>
              <input
                type="text"
                className="input-field"
                placeholder="Juan Pérez"
                {...register('fullName', { required: 'El nombre es requerido' })}
              />
              {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                {...register('email', { required: 'El email es requerido' })}
              />
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Mínimo 8 caracteres"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                className="input-field"
                placeholder="Repite tu contraseña"
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (v) => v === password || 'Las contraseñas no coinciden',
                })}
              />
              {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {serverError && (
              <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-error text-sm">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? <Spinner size="sm" color="text-white" /> : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
