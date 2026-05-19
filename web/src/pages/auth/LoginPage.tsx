import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../store/AuthContext';
import { Eye, EyeOff, Zap } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error_description || err?.response?.data?.msg || 'Credenciales incorrectas';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-text-primary">Bienvenido de nuevo</h1>
          <p className="text-text-secondary text-sm mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  placeholder="••••••••"
                  {...register('password', { required: 'La contraseña es requerida' })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-primary text-sm font-medium hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-error text-sm">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? <Spinner size="sm" color="text-white" /> : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-text-secondary mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
