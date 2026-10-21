import { Link } from 'react-router-dom'
import { Activity, Github, Twitter, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/06 py-12 px-6">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg"><span className="gradient-text">HealthSense</span><span className="text-white/80 ml-1">AI</span></span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              AI-powered health risk assessment for diabetes, heart disease, hypertension, and kidney disease. For informational purposes only — always consult your doctor.
            </p>
          </div>
          <div>
            <p className="text-white/80 font-semibold text-sm mb-4">Platform</p>
            <div className="space-y-2.5">
              {[{to:'/',l:'Home'},{to:'/predict',l:'Predict'},{to:'/dashboard',l:'Dashboard'},{to:'/chat',l:'AI Chat'}].map(x=>(
                <Link key={x.to} to={x.to} className="block text-white/50 hover:text-white text-sm transition-colors">{x.l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/80 font-semibold text-sm mb-4">Account</p>
            <div className="space-y-2.5">
              {[{to:'/login',l:'Sign In'},{to:'/signup',l:'Sign Up'}].map(x=>(
                <Link key={x.to} to={x.to} className="block text-white/50 hover:text-white text-sm transition-colors">{x.l}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/06 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-secondary fill-secondary" /> for better health outcomes
          </p>
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} HealthSense AI. For informational use only.
          </p>
          <div className="flex items-center gap-3">
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
