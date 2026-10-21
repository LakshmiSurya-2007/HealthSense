import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Building2, Phone, MapPin, CheckCircle2,
  AlertCircle, ShieldAlert, Info, PhoneCall
} from 'lucide-react'
import type { ConcernSpecialtyGroup, HealthcareProvider } from '@/data/sampleHealthcareProviders'

interface DoctorRecommendationsProps {
  groups: ConcernSpecialtyGroup[]
  hasConcerningRisks: boolean
  summaryMessage?: string
}

export function DoctorRecommendations({
  groups,
  hasConcerningRisks,
  summaryMessage,
}: DoctorRecommendationsProps) {
  const [callNotice, setCallNotice] = useState<string | null>(null)

  function handleCallClick(provider: HealthcareProvider) {
    setCallNotice(
      `Notice: "${provider.phone}" for ${provider.name} (${provider.hospitalName}) is a fictional demonstration record. Direct telephone calling is disabled. These are fictional demonstration contacts. Do not use them to contact a healthcare provider.`
    )
    setTimeout(() => {
      setCallNotice(null)
    }, 8000)
  }

  return (
    <section className="glass-card p-6 border border-white/08 relative overflow-hidden" id="recommended-doctors">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon flex-shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Recommended Doctors &amp; Hospitals
              </h2>
              <p className="text-amber-300/90 text-xs font-semibold mt-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                These are fictional demonstration contacts. Do not use them to contact a healthcare provider.
              </p>
            </div>
          </div>

          {/* Sample label badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            DEMO DATA — NOT VERIFIED
          </span>
        </div>

        {summaryMessage && (
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed mt-3 bg-white/02 p-3 rounded-xl border border-white/05">
            {summaryMessage}
          </p>
        )}
      </div>

      {/* Call demonstration banner */}
      <AnimatePresence>
        {callNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-start gap-2.5 text-xs text-amber-200"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{callNotice}</div>
            <button
              onClick={() => setCallNotice(null)}
              className="text-amber-300/70 hover:text-white font-bold ml-2 text-xs"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* If NO concerning risks identified */}
      {!hasConcerningRisks && (
        <div className="relative z-10 p-5 rounded-2xl bg-emerald-500/08 border border-emerald-500/20 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-emerald-300 font-bold text-sm">Routine Preventive Care Overview</h3>
              <p className="text-white/70 text-xs leading-relaxed">
                Your assessment indicates favorable health markers with no urgent specialist referrals required. A general annual physical examination with a Primary Care Physician remains recommended to maintain optimal metabolic and cardiovascular wellness.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Groups by Concern */}
      <div className="space-y-6 relative z-10">
        {groups.map(group => (
          <div key={group.concernId} className="space-y-3">
            {/* Concern header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/06">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    group.urgencyLevel === 'priority'
                      ? 'bg-red-400 animate-pulse'
                      : group.urgencyLevel === 'advisory'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <h3 className="text-white font-bold text-sm">{group.concernTitle}</h3>
                <span className="text-white/40 text-xs">• Recommended: <strong className="text-secondary font-medium">{group.specialtyName}</strong></span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  group.urgencyLevel === 'priority'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : group.urgencyLevel === 'advisory'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {group.urgencyLevel === 'priority'
                  ? 'Prompt Clinical Review'
                  : group.urgencyLevel === 'advisory'
                  ? 'Recommended Evaluation'
                  : 'Routine Care'}
              </span>
            </div>

            <p className="text-white/50 text-xs italic pl-4">{group.concernDescription}</p>

            {/* Provider Cards */}
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              {group.providers.map(provider => (
                <motion.div
                  key={provider.id + provider.concernCategory}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl p-4 bg-white/03 border border-white/07 hover:border-primary/40 transition-all flex flex-col justify-between relative group"
                >
                  {/* Card Sample Banner */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase flex items-center gap-1">
                      <Info className="w-2.5 h-2.5 text-amber-400" />
                      DEMO DATA — NOT VERIFIED
                    </span>
                    <span className="text-[11px] text-white/40">{provider.experienceYears}+ yrs experience</span>
                  </div>

                  {/* Doctor Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm">
                        {provider.name.split(' ')[1]?.[0] || 'D'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-bold text-sm truncate">{provider.name}</h4>
                        <p className="text-secondary text-xs font-semibold">{provider.specialty}</p>
                        {provider.subSpecialty && (
                          <p className="text-white/45 text-[11px] truncate">{provider.subSpecialty}</p>
                        )}
                      </div>
                    </div>

                    {/* Hospital / Clinic */}
                    <div className="pt-2 border-t border-white/05 space-y-1.5 text-xs text-white/70">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white/90 leading-tight">{provider.hospitalName}</p>
                          <p className="text-[10px] text-white/40">{provider.hospitalType}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-white/60 leading-relaxed">{provider.address}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-amber-400/90 flex-shrink-0" />
                        <span className="text-[11px] font-mono text-white/90 font-medium">{provider.phone}</span>
                        <span className="text-[9px] text-amber-400/80 font-semibold">(Demo Number)</span>
                      </div>
                    </div>

                    {/* Reason for recommendation */}
                    <div className="mt-3 p-2.5 rounded-xl bg-white/02 border border-white/05 text-[11px] text-white/65 leading-relaxed">
                      <strong className="text-white/80 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Reason for Recommendation:
                      </strong>
                      {provider.reasonForRecommendation}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-white/06 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-amber-300/60 italic">
                      Fictional demo record
                    </span>
                    {provider.isVerified ? (
                      <a
                        href={`tel:${provider.phone}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Call Doctor</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCallClick(provider)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/05 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Fictional demonstration contact — calling disabled"
                        aria-disabled="true"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-400/80" />
                        <span>Demo Contact</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Medical Safety Notice */}
      <div className="mt-6 pt-4 border-t border-white/08 space-y-2 text-xs text-white/40 leading-relaxed">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-amber-300">DEMO DATA NOTICE:</strong> All healthcare provider profiles, addresses, and phone numbers displayed in this demonstration directory are synthetic demonstration records. <strong>These are fictional demonstration contacts. Do not use them to contact a healthcare provider.</strong>
          </p>
        </div>
        <p className="pl-6.5 text-[11px] text-white/35">
          <strong className="text-white/50">Clinical Disclaimer:</strong> HealthSense AI provides educational risk estimations and does not establish a medical diagnosis or prescribe clinical regimens. Please consult verified medical professionals and official healthcare directories for genuine clinical consultations.
        </p>
      </div>
    </section>
  )
}
