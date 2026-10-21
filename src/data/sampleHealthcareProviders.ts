// HealthSense AI — Sample Healthcare Providers Directory
// Contains demonstration provider records mapped to disease risk categories
// NOTE: All records are strictly for demonstration/sample purposes and clearly marked as unverified.

export type HealthConcernCategory =
  | 'diabetes'
  | 'heart'
  | 'hypertension'
  | 'kidney'
  | 'dermatology'
  | 'pulmonology'
  | 'general'

export interface HealthcareProvider {
  id: string
  name: string
  specialty: string
  subSpecialty?: string
  concernCategory: HealthConcernCategory
  hospitalName: string
  hospitalType: string
  city: string
  address: string
  phone: string
  experienceYears: number
  consultationModes: string[]
  reasonForRecommendation: string
  isSample: boolean
  isDemo?: boolean
  isVerified?: boolean
  demoNotice?: string
}

export const DEMO_PROVIDER_DISCLAIMER =
  'These are fictional demonstration contacts. Do not use them to contact a healthcare provider.'

export const DEMO_DATA_LABEL = 'DEMO DATA — NOT VERIFIED'

export interface ConcernSpecialtyGroup {
  concernId: HealthConcernCategory
  concernTitle: string
  concernDescription: string
  specialtyName: string
  urgencyLevel: 'routine' | 'advisory' | 'priority'
  providers: HealthcareProvider[]
}

export interface RecommendationSummary {
  hasConcerningRisks: boolean
  groups: ConcernSpecialtyGroup[]
  summaryMessage: string
}

/**
 * Sample Directory of Healthcare Providers
 * All records strictly contain fictional demonstration values for showcase purposes.
 * To be replaced with verified, real-time hospital and doctor database/API in the future.
 */
export const SAMPLE_HEALTHCARE_PROVIDERS: HealthcareProvider[] = [
  {
    id: 'sample-doc-1',
    name: 'Dr. Ananya Rao',
    specialty: 'Endocrinologist & Diabetologist',
    subSpecialty: 'Metabolic Disorders & Glycemic Management',
    concernCategory: 'diabetes',
    hospitalName: 'Metro Care Diabetes & Endocrine Institute (Sample Facility)',
    hospitalType: 'Sample Diabetes Speciality Clinic',
    city: 'Bangalore',
    address: '100 Feet Road, Indiranagar, Bangalore, Karnataka 560038 (Sample Location)',
    phone: '+91 98765 43210',
    experienceYears: 14,
    consultationModes: ['In-Person Clinic', 'Video Consultation'],
    reasonForRecommendation:
      'Recommended for clinical evaluation of elevated blood glucose, HbA1c review, and personalized dietary/metabolic intervention.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
  {
    id: 'sample-doc-2',
    name: 'Dr. Rahul Sharma',
    specialty: 'Cardiologist & Vascular Specialist',
    subSpecialty: 'Preventive Cardiology & Hypertension Management',
    concernCategory: 'heart',
    hospitalName: 'Apex Heart & Vascular Center (Sample Facility)',
    hospitalType: 'Sample Cardiac Care Hospital',
    city: 'Hyderabad',
    address: 'Road No. 2, Banjara Hills, Hyderabad, Telangana 500034 (Sample Location)',
    phone: '+91 87654 32109',
    experienceYears: 16,
    consultationModes: ['In-Person Hospital', 'Cardiology Outpatient'],
    reasonForRecommendation:
      'Recommended for comprehensive cardiovascular risk assessment, lipid profile optimization, and electrocardiographic evaluation.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
  {
    id: 'sample-doc-3',
    name: 'Dr. Rahul Sharma',
    specialty: 'Cardiologist & Hypertension Specialist',
    subSpecialty: 'Arterial Blood Pressure Regulation',
    concernCategory: 'hypertension',
    hospitalName: 'Apex Heart & Vascular Center (Sample Facility)',
    hospitalType: 'Sample Hypertension & Cardiac Clinic',
    city: 'Hyderabad',
    address: 'Road No. 2, Banjara Hills, Hyderabad, Telangana 500034 (Sample Location)',
    phone: '+91 87654 32109',
    experienceYears: 16,
    consultationModes: ['In-Person Clinic', 'Ambulatory BP Monitoring'],
    reasonForRecommendation:
      'Recommended for blood pressure verification, stage assessment, sodium sensitivity review, and arterial health monitoring.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
  {
    id: 'sample-doc-4',
    name: 'Dr. Arvind Mehta',
    specialty: 'Consultant Nephrologist',
    subSpecialty: 'Renal Function & Diabetic Nephropathy',
    concernCategory: 'kidney',
    hospitalName: 'National Kidney & Renal Institute (Sample Center)',
    hospitalType: 'Sample Nephrology Center',
    city: 'Mumbai',
    address: 'SV Road, Andheri West, Mumbai, Maharashtra 400058 (Sample Location)',
    phone: '+91 76543 21098',
    experienceYears: 15,
    consultationModes: ['In-Person Center', 'Lab Follow-up Consultation'],
    reasonForRecommendation:
      'Recommended for renal parameter verification (eGFR, serum creatinine, microalbuminuria) and kidney health safeguarding.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
  {
    id: 'sample-doc-5',
    name: 'Dr. Priya Reddy',
    specialty: 'Consultant Dermatologist',
    subSpecialty: 'Clinical Dermatology & Cutaneous Pathology',
    concernCategory: 'dermatology',
    hospitalName: 'Skin & Aesthetic Care Clinic (Sample Clinic)',
    hospitalType: 'Sample Dermatology Clinic',
    city: 'Bangalore',
    address: '80 Feet Road, 4th Block, Koramangala, Bangalore, Karnataka 560034 (Sample Location)',
    phone: '+91 91234 56780',
    experienceYears: 11,
    consultationModes: ['In-Person Dermoscopy', 'Tele-Dermatology'],
    reasonForRecommendation:
      'Recommended for physical in-person examination of cutaneous lesions, rash evaluation, and targeted dermatological care.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
  {
    id: 'sample-doc-6',
    name: 'Dr. Kiran Kumar',
    specialty: 'General Physician & Internal Medicine Specialist',
    subSpecialty: 'Preventive Health Checkups & Multi-System Care',
    concernCategory: 'general',
    hospitalName: 'LifeSpring Community Hospital (Sample Hospital)',
    hospitalType: 'Sample Multi-Specialty Hospital',
    city: 'Chennai',
    address: '2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040 (Sample Location)',
    phone: '+91 93456 78901',
    experienceYears: 18,
    consultationModes: ['Primary Care Clinic', 'Executive Health Checkup'],
    reasonForRecommendation:
      'Recommended for comprehensive general medical evaluations, baseline blood panels, and coordinated multi-risk management.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
  {
    id: 'sample-doc-7',
    name: 'Dr. Shalini Verma',
    specialty: 'Consultant Pulmonologist',
    subSpecialty: 'Respiratory Medicine & Smoking Cessation',
    concernCategory: 'pulmonology',
    hospitalName: 'City Chest & Allergy Hospital (Sample Hospital)',
    hospitalType: 'Sample Respiratory Care Hospital',
    city: 'New Delhi',
    address: 'Barakhamba Road, Connaught Place, New Delhi 110001 (Sample Location)',
    phone: '+91 82345 67891',
    experienceYears: 13,
    consultationModes: ['In-Person Hospital', 'Spirometry Screening'],
    reasonForRecommendation:
      'Recommended for respiratory evaluation, lung capacity screening, and smoking cessation support.',
    isSample: true,
    isDemo: true,
    isVerified: false,
    demoNotice: DEMO_PROVIDER_DISCLAIMER,
  },
]

/**
 * Matches prediction report outcomes to appropriate healthcare providers.
 * Adheres strictly to medical safety: results are treated as educational risk indicators,
 * not clinical diagnoses.
 */
export function getRecommendedProvidersForReport(report: {
  diabetes_risk?: number
  heart_risk?: number
  hypertension_risk?: number
  kidney_risk?: number
  health_score?: number
  risk_level?: string
  input?: Record<string, any>
  category_details?: Record<string, any>
}): RecommendationSummary {
  const groups: ConcernSpecialtyGroup[] = []

  const dRisk = report.diabetes_risk ?? 0
  const hRisk = report.heart_risk ?? 0
  const bpRisk = report.hypertension_risk ?? 0
  const kRisk = report.kidney_risk ?? 0
  const glucoseVal = Number(report.input?.glucose) || 0
  const sysVal = Number(report.input?.blood_pressure_sys) || 0
  const diaVal = Number(report.input?.blood_pressure_dia) || 0
  const cholVal = Number(report.input?.cholesterol) || 0
  const smoking = String(report.input?.smoking_status || '').toLowerCase()

  // 1. Diabetes Concern: Elevated glucose or diabetes risk >= 30%
  const isDiabetesElevated =
    dRisk >= 30 ||
    glucoseVal >= 126 ||
    report.category_details?.diabetes?.risk_level === 'high' ||
    report.category_details?.diabetes?.risk_level === 'medium'

  if (isDiabetesElevated) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'diabetes')
    groups.push({
      concernId: 'diabetes',
      concernTitle: 'Blood Glucose & Metabolic Profile',
      concernDescription:
        dRisk >= 50 || glucoseVal >= 140
          ? 'Calculated metrics indicate elevated fasting glucose / diabetes risk requiring timely clinical review.'
          : 'Moderate glycemic risk detected. A targeted metabolic checkup is recommended to optimize preventive steps.',
      specialtyName: 'Endocrinologist / Diabetologist',
      urgencyLevel: dRisk >= 50 || glucoseVal >= 140 ? 'priority' : 'advisory',
      providers: provs,
    })
  }

  // 2. Hypertension Concern: BP >= 135/85 or hypertension risk >= 30%
  const isHypertensionElevated =
    bpRisk >= 30 ||
    sysVal >= 135 ||
    diaVal >= 85 ||
    report.category_details?.hypertension?.risk_level === 'high' ||
    report.category_details?.hypertension?.risk_level === 'medium'

  if (isHypertensionElevated) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'hypertension')
    groups.push({
      concernId: 'hypertension',
      concernTitle: 'Blood Pressure & Arterial Health',
      concernDescription:
        bpRisk >= 50 || sysVal >= 140 || diaVal >= 90
          ? 'Elevated arterial pressure readings noted. Formal ambulatory pressure monitoring with a specialist is advised.'
          : 'Mildly elevated blood pressure risk indicator. A routine clinical verification is recommended.',
      specialtyName: 'Cardiologist / Hypertension Specialist',
      urgencyLevel: bpRisk >= 50 || sysVal >= 140 || diaVal >= 90 ? 'priority' : 'advisory',
      providers: provs,
    })
  }

  // 3. Heart Disease Concern: Heart risk >= 30% or total cholesterol >= 240
  const isHeartElevated =
    hRisk >= 30 ||
    cholVal >= 240 ||
    report.category_details?.heart?.risk_level === 'high' ||
    report.category_details?.heart?.risk_level === 'medium'

  if (isHeartElevated) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'heart')
    // Avoid duplicate card if already showing cardiologist for hypertension
    const alreadyHasSharma = groups.some(g => g.providers.some(p => p.name === 'Dr. Rahul Sharma'))
    groups.push({
      concernId: 'heart',
      concernTitle: 'Cardiovascular Risk & Lipid Profile',
      concernDescription:
        hRisk >= 50 || cholVal >= 260
          ? 'Cardiovascular risk scores suggest prioritized evaluation of heart rhythm, vascular tone, and lipid fractions.'
          : 'Moderate cardiovascular risk noted. Lifestyle review and lipid evaluation with a specialist is recommended.',
      specialtyName: 'Preventive Cardiologist',
      urgencyLevel: hRisk >= 50 || cholVal >= 260 ? 'priority' : 'advisory',
      providers: alreadyHasSharma ? provs.slice(0, 1) : provs,
    })
  }

  // 4. Kidney Disease Concern: Kidney risk >= 30%
  const isKidneyElevated =
    kRisk >= 30 ||
    report.category_details?.kidney?.risk_level === 'high' ||
    report.category_details?.kidney?.risk_level === 'medium'

  if (isKidneyElevated) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'kidney')
    groups.push({
      concernId: 'kidney',
      concernTitle: 'Renal & Kidney Health Indicators',
      concernDescription:
        'Biomarker indicators highlight potential kidney strain or secondary microvascular risk. Renal function testing is advised.',
      specialtyName: 'Nephrologist / Renal Specialist',
      urgencyLevel: kRisk >= 50 ? 'priority' : 'advisory',
      providers: provs,
    })
  }

  // 5. Respiratory Concern (e.g. smoking)
  if (smoking === 'current' && (hRisk >= 30 || bpRisk >= 30)) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'pulmonology')
    groups.push({
      concernId: 'pulmonology',
      concernTitle: 'Pulmonary & Respiratory Wellness',
      concernDescription:
        'Active tobacco exposure coupled with cardiovascular indicators warrants a respiratory capacity and spirometry evaluation.',
      specialtyName: 'Consultant Pulmonologist',
      urgencyLevel: 'advisory',
      providers: provs,
    })
  }

  // 6. Multiple Concerns or General Health
  const hasMultipleConcerns = groups.length >= 2 || (report.health_score !== undefined && report.health_score < 55)
  if (hasMultipleConcerns) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'general')
    groups.push({
      concernId: 'general',
      concernTitle: 'Comprehensive Primary & Multi-System Care',
      concernDescription:
        'With multiple interconnected risk factors identified, an experienced General Physician can help coordinate your overall care plan.',
      specialtyName: 'General Physician / Internal Medicine',
      urgencyLevel: 'advisory',
      providers: provs,
    })
  }

  // 7. If assessment is incomplete or empty: fallback to General Physician
  if (!report.risk_level && groups.length === 0) {
    const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'general')
    groups.push({
      concernId: 'general',
      concernTitle: 'Routine Primary Health Review',
      concernDescription:
        'Whenever health risk parameters are unconfirmed or baseline data is partial, consulting a General Physician is the safest first step.',
      specialtyName: 'General Physician',
      urgencyLevel: 'routine',
      providers: provs,
    })
    return {
      hasConcerningRisks: false,
      groups,
      summaryMessage:
        'Baseline assessment is incomplete or pending. A routine review with a General Physician is advised.',
    }
  }

  // 8. Low Risk Outcome: all risks < 30% and no concerning biomarkers
  if (groups.length === 0) {
    return {
      hasConcerningRisks: false,
      groups: [
        {
          concernId: 'general',
          concernTitle: 'Routine Preventive Health Maintenance',
          concernDescription:
            'All calculated parameters fall within the low/optimal risk range. No immediate specialist referrals are required at this time.',
          specialtyName: 'Primary Care / General Physician',
          urgencyLevel: 'routine',
          providers: SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'general'),
        },
      ],
      summaryMessage:
        'Great news! Your estimated risk markers fall within normal, low-risk ranges. No specialized disease consultations are currently indicated. Periodic annual wellness checkups with a general practitioner remain the gold standard for preventive health.',
    }
  }

  return {
    hasConcerningRisks: true,
    groups,
    summaryMessage:
      'Based on your assessment results, the following medical specialties and sample providers are recommended for in-depth professional evaluation.',
  }
}

/**
 * Matches visual image analysis findings to Dermatology specialists
 */
export function getRecommendedProvidersForImageAnalysis(conditionName?: string): {
  groups: ConcernSpecialtyGroup[]
  summaryMessage: string
} {
  const provs = SAMPLE_HEALTHCARE_PROVIDERS.filter(p => p.concernCategory === 'dermatology')
  return {
    groups: [
      {
        concernId: 'dermatology',
        concernTitle: `Visual Skin Observation (${conditionName || 'Dermatological Assessment'})`,
        concernDescription:
          'AI photographic evaluation provides visual education only. An in-person dermatological examination with dermoscopy is essential for accurate diagnosis and prescription.',
        specialtyName: 'Consultant Dermatologist',
        urgencyLevel: 'advisory',
        providers: provs,
      },
    ],
    summaryMessage:
      'For any unusual skin discoloration, lesion, or persistent rash, clinical examination by a certified dermatologist is strongly advised.',
  }
}
