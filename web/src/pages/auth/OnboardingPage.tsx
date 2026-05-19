import { useNavigate } from 'react-router-dom';
import { Camera, BarChart2, Shield, Zap } from 'lucide-react';

const features = [
  { icon: Camera, title: 'Escanea recibos', desc: 'Fotografía cualquier recibo y la IA extrae todos los datos automáticamente.' },
  { icon: BarChart2, title: 'Analiza gastos', desc: 'Visualiza tus gastos por categoría, mes y tendencias a lo largo del tiempo.' },
  { icon: Shield, title: '100% seguro', desc: 'Tus datos se almacenan de forma cifrada y nunca se comparten.' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Zap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white">ReceiptAI</h1>
          <p className="text-white/75 mt-2 text-lg">Gestión inteligente de recibos</p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white">{title}</p>
                <p className="text-white/70 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-white text-primary font-bold py-4 rounded-2xl text-base hover:bg-white/90 transition-colors"
          >
            Empezar gratis
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white/15 text-white font-bold py-4 rounded-2xl text-base hover:bg-white/20 transition-colors"
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
