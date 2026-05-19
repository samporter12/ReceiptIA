import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/api';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setServerError('');
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch {
      setServerError('No se pudo enviar el email. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-2 text-text-secondary text-sm mb-8 hover:text-text-primary transition-colors">
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </Link>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-success" />
            </div>
            <h2 className="text-2xl font-black text-text-primary">Email enviado</h2>
            <p className="text-text-secondary mt-2 text-sm">
              Revisa tu bandeja de entrada y sigue el link para restablecer tu contraseña.
            </p>
            <Link to="/login">
              <button className="btn-primary mt-6 w-full py-3">Volver al inicio</button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-primary" />
              </div>
              <h1 className="text-2xl font-black text-text-primary">Recuperar contraseña</h1>
              <p className="text-text-secondary text-sm mt-1">
                Ingresa tu email y te enviaremos un link de recuperación
              </p>
            </div>

            <div className="card">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                {serverError && (
                  <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-error text-sm">
                    {serverError}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                  {isSubmitting ? <Spinner size="sm" color="text-white" /> : 'Enviar link de recuperación'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
