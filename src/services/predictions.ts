// HealthSense AI — Risk Estimation Prototype
// Educational risk-estimation engine based on established preventive health guidelines
// Note: This is an educational prototype and not a medically validated clinical diagnostic model.

import { clamp } from '@/lib/utils'

export interface HealthInput {
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  bmi: number
  glucose: number
  blood_pressure_sys: number
  blood_pressure_dia: number
  cholesterol: number
  heart_rate: number
  smoking_status: string
  alcohol_consumption: string
  sleep_hours: number
  physical_activity: string
  family_diabetes: boolean
  family_heart: boolean
  family_hypertension: boolean
  family_kidney: boolean
}

export interface RiskCategoryDetail {
  score: number
  level: 'low' | 'medium' | 'high'
  drivers: string[]
  explanation: string
}

export interface PredictionResult {
  diabetes_risk: number
  heart_risk: number
  kidney_risk: number
  hypertension_risk: number
  health_score: number
  risk_level: 'low' | 'medium' | 'high'
  recommendations: string[]
  category_details: {
    diabetes: RiskCategoryDetail
    heart: RiskCategoryDetail
    hypertension: RiskCategoryDetail
    kidney: RiskCategoryDetail
  }
  prototype_disclaimer: string
}

const rnd = (n: number) => Math.round(n)
const c = (v: number) => clamp(v, 0, 100)

export function calculateBMI(height_cm: number, weight_kg: number): number {
  const hm = height_cm / 100
  if (hm <= 0 || weight_kg <= 0) return 22.0
  return parseFloat((weight_kg / (hm * hm)).toFixed(1))
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#06b6d4' }
  if (bmi < 25.0) return { label: 'Normal weight (Healthy Range)', color: '#10b981' }
  if (bmi < 30.0) return { label: 'Overweight', color: '#f59e0b' }
  return { label: 'Obese', color: '#ef4444' }
}

export function runPredictions(d: HealthInput): PredictionResult {
  const safeBmi = d.bmi || calculateBMI(d.height_cm, d.weight_kg)

  // 1. Diabetes Risk Estimation
  let db = 0
  const dbDrivers: string[] = []

  if (d.glucose >= 200) {
    db += 42
    dbDrivers.push('Significantly elevated blood glucose (≥200 mg/dL)')
  } else if (d.glucose >= 126) {
    db += 32
    dbDrivers.push('Fasting glucose in diabetic threshold (≥126 mg/dL)')
  } else if (d.glucose >= 100) {
    db += 18
    dbDrivers.push('Pre-diabetes glucose range (100–125 mg/dL)')
  } else if (d.glucose > 0) {
    dbDrivers.push('Fasting glucose in optimal range (<100 mg/dL)')
  }

  if (safeBmi >= 35) {
    db += 20
    dbDrivers.push(`High BMI (${safeBmi}) places extra demand on insulin secretion`)
  } else if (safeBmi >= 30) {
    db += 14
    dbDrivers.push(`BMI in obese range (${safeBmi}) increases insulin resistance`)
  } else if (safeBmi >= 25) {
    db += 7
    dbDrivers.push(`BMI in overweight range (${safeBmi})`)
  }

  if (d.age >= 60) db += 10
  else if (d.age >= 45) db += 7
  else if (d.age >= 35) db += 3

  if (d.family_diabetes) {
    db += 16
    dbDrivers.push('Direct family history of Type 2 Diabetes')
  }
  if (d.physical_activity === 'sedentary') {
    db += 7
    dbDrivers.push('Sedentary lifestyle reduces cellular glucose uptake')
  }
  if (d.smoking_status === 'current') {
    db += 5
    dbDrivers.push('Active smoking impairs insulin sensitivity')
  }
  db = c(db)

  // 2. Cardiovascular Risk Estimation
  let hr = 0
  const hrDrivers: string[] = []

  if (d.blood_pressure_sys >= 160 || d.blood_pressure_dia >= 100) {
    hr += 28
    hrDrivers.push('Stage 2 hypertension strain on arterial walls')
  } else if (d.blood_pressure_sys >= 140 || d.blood_pressure_dia >= 90) {
    hr += 20
    hrDrivers.push('Stage 1 hypertension')
  } else if (d.blood_pressure_sys >= 130 || d.blood_pressure_dia >= 80) {
    hr += 12
    hrDrivers.push('Elevated systolic/diastolic blood pressure')
  }

  if (d.cholesterol >= 240) {
    hr += 24
    hrDrivers.push(`High total cholesterol (${d.cholesterol} mg/dL) promotes plaque formation`)
  } else if (d.cholesterol >= 200) {
    hr += 14
    hrDrivers.push(`Borderline high cholesterol (${d.cholesterol} mg/dL)`)
  }

  if (d.smoking_status === 'current') {
    hr += 22
    hrDrivers.push('Current smoking is a major driver of arterial damage')
  } else if (d.smoking_status === 'former') {
    hr += 8
    hrDrivers.push('Former smoking history')
  }

  if (d.family_heart) {
    hr += 16
    hrDrivers.push('Family history of early coronary artery disease or stroke')
  }
  if (d.age >= 60) hr += 12
  else if (d.age >= 45) hr += 7
  if (d.gender === 'male' && d.age >= 45) hr += 5
  if (d.physical_activity === 'sedentary') hr += 8

  hr = c(hr)

  // 3. Chronic Kidney Disease Risk
  let kr = 0
  const krDrivers: string[] = []

  if (d.glucose >= 140) {
    kr += 24
    krDrivers.push('Chronic high blood glucose can stress microvascular filtering units')
  }
  if (d.blood_pressure_sys >= 140) {
    kr += 20
    krDrivers.push('High blood pressure damages delicate renal glomeruli')
  }
  if (safeBmi >= 30) {
    kr += 10
    krDrivers.push('Obesity-related hyperfiltration stress')
  }
  if (d.age >= 60) kr += 12
  if (d.family_kidney) {
    kr += 15
    krDrivers.push('Family history of renal disease')
  }
  if (d.family_diabetes) kr += 8
  if (d.smoking_status === 'current') kr += 8
  if (d.alcohol_consumption === 'heavy') kr += 8

  kr = c(kr)

  // 4. Hypertension Risk
  let hy = 0
  const hyDrivers: string[] = []

  if (d.blood_pressure_sys >= 140 || d.blood_pressure_dia >= 90) {
    hy += 42
    hyDrivers.push(`Existing blood pressure reading (${d.blood_pressure_sys}/${d.blood_pressure_dia} mmHg) meets hypertension thresholds`)
  } else if (d.blood_pressure_sys >= 130 || d.blood_pressure_dia >= 80) {
    hy += 26
    hyDrivers.push('Borderline elevated blood pressure')
  } else if (d.blood_pressure_sys >= 120) {
    hy += 12
    hyDrivers.push('Systolic pressure above optimal <120 mmHg')
  }

  if (safeBmi >= 30) {
    hy += 16
    hyDrivers.push('Excess adiposity increases systemic vascular resistance')
  } else if (safeBmi >= 25) {
    hy += 8
  }

  if (d.family_hypertension) {
    hy += 16
    hyDrivers.push('Strong genetic predisposition to high blood pressure')
  }
  if (d.age >= 60) hy += 10
  else if (d.age >= 45) hy += 6
  if (d.smoking_status === 'current') hy += 10
  if (d.alcohol_consumption === 'heavy') hy += 9
  if (d.physical_activity === 'sedentary') hy += 6

  hy = c(hy)

  // Overall Health Score calculation (0 to 100)
  const bmiS = safeBmi >= 18.5 && safeBmi < 25 ? 20 : safeBmi < 30 ? 14 : safeBmi < 35 ? 8 : 3
  const bsS  = d.glucose <= 0 ? 15 : d.glucose < 100 ? 20 : d.glucose < 126 ? 12 : d.glucose < 200 ? 5 : 1
  const bpS  = d.blood_pressure_sys <= 0 ? 15 : d.blood_pressure_sys < 120 ? 20 : d.blood_pressure_sys < 130 ? 15 : d.blood_pressure_sys < 140 ? 8 : 2
  const exS  = ({ active: 20, moderate: 15, light: 9, sedentary: 3 }[d.physical_activity] ?? 12)
  const slpS = d.sleep_hours >= 7 && d.sleep_hours <= 9 ? 20 : d.sleep_hours >= 6 ? 14 : 6
  const health_score = rnd(bmiS + bsS + bpS + exS + slpS)

  const avgRisk = (db + hr + kr + hy) / 4
  const risk_level: 'low' | 'medium' | 'high' = avgRisk >= 50 ? 'high' : avgRisk >= 25 ? 'medium' : 'low'

  const recommendations: string[] = []
  if (db >= 35) recommendations.push('Schedule an HbA1c screening with your physician to evaluate blood sugar control')
  if (db >= 20) recommendations.push('Focus on a low-glycemic Mediterranean or whole-food diet to stabilize post-meal glucose')
  if (hr >= 35) recommendations.push('Consult a cardiologist or primary doctor for a comprehensive cardiovascular lipid panel')
  if (hr >= 20) recommendations.push('Incorporate heart-healthy unsaturated fats (olive oil, nuts) and limit saturated fats')
  if (hy >= 35) recommendations.push('Adopt the DASH eating plan, aiming for sodium intake under 1,500–2,000 mg/day')
  if (kr >= 30) recommendations.push('Stay well-hydrated and request routine renal function tests (eGFR and urine albumin)')
  if (safeBmi >= 25) recommendations.push(`Target gradual, sustainable weight management toward a healthy BMI (18.5–24.9)`)
  if (d.physical_activity === 'sedentary') recommendations.push('Target 150+ minutes of moderate aerobic activity weekly (brisk walking, cycling, swimming)')
  if (d.smoking_status === 'current') recommendations.push('Smoking cessation yields immediate improvements in arterial elasticity and heart rate')
  if (!recommendations.length) recommendations.push('Continue maintaining your healthy lifestyle habits and attend periodic preventive check-ups')

  const getLevel = (v: number): 'low' | 'medium' | 'high' => v >= 55 ? 'high' : v >= 28 ? 'medium' : 'low'

  return {
    diabetes_risk: rnd(db),
    heart_risk: rnd(hr),
    kidney_risk: rnd(kr),
    hypertension_risk: rnd(hy),
    health_score: clamp(health_score, 0, 100),
    risk_level,
    recommendations,
    category_details: {
      diabetes: {
        score: rnd(db),
        level: getLevel(db),
        drivers: dbDrivers.length ? dbDrivers : ['Normal metabolic indicators recorded'],
        explanation: 'Assesses likelihood of insulin resistance and pre-diabetes based on glucose, BMI, and family history.'
      },
      heart: {
        score: rnd(hr),
        level: getLevel(hr),
        drivers: hrDrivers.length ? hrDrivers : ['Blood pressure and lipid indicators in desirable range'],
        explanation: 'Estimates 10-year cardiovascular strain based on systolic pressure, cholesterol, smoking, and age.'
      },
      hypertension: {
        score: rnd(hy),
        level: getLevel(hy),
        drivers: hyDrivers.length ? hyDrivers : ['Blood pressure readings within healthy limits'],
        explanation: 'Evaluates chronic blood pressure risk using current measurements, family history, and sodium/lifestyle factors.'
      },
      kidney: {
        score: rnd(kr),
        level: getLevel(kr),
        drivers: krDrivers.length ? krDrivers : ['No primary renal stressors reported'],
        explanation: 'Considers downstream kidney filtration burden driven primarily by blood pressure and glycemic stability.'
      }
    },
    prototype_disclaimer: 'Educational Prototype Notice: Risk scores are non-diagnostic, heuristic estimates computed from lifestyle and preventive health guidelines. They do not constitute a clinical diagnosis or medical validation.'
  }
}
