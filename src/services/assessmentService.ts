// HealthSense AI — Assessment Persistence Service
// Manages saving, fetching, and syncing health risk reports with Supabase
// Integrates with the exact schema: 'predictions', 'reports', 'health_scores', 'health_records'

import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { HealthInput, PredictionResult } from '@/services/predictions'
import { runPredictions, calculateBMI } from '@/services/predictions'

export interface SavedReportData {
  id: string
  prediction_id: string
  created_at: string
  assessment_date?: string
  health_score: number
  risk_level: 'low' | 'medium' | 'high'
  diabetes_risk: number
  heart_risk: number
  hypertension_risk: number
  kidney_risk: number
  input: HealthInput
  input_parameters?: HealthInput
  result: PredictionResult
  recommendations: string[]
  suggestions?: string[]
  risk_factors: string[]
  category_details?: PredictionResult['category_details']
  complete_report?: Record<string, any>
  title?: string
  report_type?: string
}

export interface SaveAssessmentParams {
  id?: string
  input: HealthInput
  result: PredictionResult
  createdAt?: string
}

export interface SaveAssessmentResult {
  success: boolean
  id: string
  predictionId: string
  error?: string
  errorCode?: string
  savedLocally?: boolean
}

const LOCAL_STORAGE_KEY_PREFIX = 'healthsense_report_'
const LOCAL_LIST_KEY = 'healthsense_saved_reports_list'

/**
 * Extracts a clean list of driver risk factors from the prediction category details
 */
export function extractRiskFactors(result: PredictionResult): string[] {
  const factors: string[] = []
  if (result.category_details) {
    const cats = ['diabetes', 'heart', 'hypertension', 'kidney'] as const
    for (const k of cats) {
      const cat = result.category_details[k]
      if (cat?.drivers && Array.isArray(cat.drivers)) {
        for (const d of cat.drivers) {
          if (
            !factors.includes(d) &&
            !d.toLowerCase().includes('normal') &&
            !d.toLowerCase().includes('optimal') &&
            !d.toLowerCase().includes('no primary')
          ) {
            factors.push(d)
          }
        }
      }
    }
  }
  return factors
}

/**
 * Saves a health risk assessment report to Supabase across:
 * 1. 'predictions' (input_data, result_data, risk_level)
 * 2. 'reports' (report_data, title, report_type, prediction_id)
 * 3. 'health_scores' (score, score_type, score_data, prediction_id)
 * 4. 'health_records' (record_data, notes)
 */
export async function saveAssessment(
  params: SaveAssessmentParams,
  user: User | null
): Promise<SaveAssessmentResult> {
  const reportId = params.id || crypto.randomUUID()
  const predictionId = reportId // Using matching ID for consistency
  const timestamp = params.createdAt || new Date().toISOString()
  const riskFactors = extractRiskFactors(params.result)

  const completeReportPayload: SavedReportData = {
    id: reportId,
    prediction_id: predictionId,
    created_at: timestamp,
    health_score: params.result.health_score,
    risk_level: params.result.risk_level,
    diabetes_risk: params.result.diabetes_risk,
    heart_risk: params.result.heart_risk,
    hypertension_risk: params.result.hypertension_risk,
    kidney_risk: params.result.kidney_risk,
    input: params.input,
    result: params.result,
    recommendations: params.result.recommendations || [],
    risk_factors: riskFactors,
    category_details: params.result.category_details,
    title: `Health Assessment Report - ${new Date(timestamp).toLocaleDateString()}`,
    report_type: 'comprehensive_risk',
  }

  // 1. Client-side local backup
  try {
    sessionStorage.setItem('healthsense_latest_report', JSON.stringify(completeReportPayload))
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${reportId}`, JSON.stringify(completeReportPayload))
    const existingListStr = localStorage.getItem(LOCAL_LIST_KEY)
    const existingList: string[] = existingListStr ? JSON.parse(existingListStr) : []
    if (!existingList.includes(reportId)) {
      existingList.unshift(reportId)
      localStorage.setItem(LOCAL_LIST_KEY, JSON.stringify(existingList.slice(0, 50)))
    }
  } catch (cacheErr) {
    console.warn('Could not cache assessment to client storage:', cacheErr)
  }

  // 2. Authenticated check
  if (!user) {
    return {
      success: false,
      id: reportId,
      predictionId,
      error: 'You must be logged in to save health assessment reports to your cloud account permanently.',
      savedLocally: true,
    }
  }

  try {
    // A. Insert into 'predictions'
    const { error: predErr } = await supabase
      .from('predictions')
      .upsert({
        id: predictionId,
        user_id: user.id,
        input_data: params.input,
        result_data: params.result,
        risk_level: params.result.risk_level,
        created_at: timestamp,
      }, { onConflict: 'id' })

    if (predErr) {
      console.error('[Supabase predictions error]:', predErr)
      return {
        success: false,
        id: reportId,
        predictionId,
        error: `Failed to save predictions: ${predErr.message}`,
        errorCode: predErr.code,
        savedLocally: true,
      }
    }

    // B. Insert into 'reports'
    const { error: repErr } = await supabase
      .from('reports')
      .upsert({
        id: reportId,
        user_id: user.id,
        prediction_id: predictionId,
        report_data: completeReportPayload,
        title: completeReportPayload.title,
        report_type: completeReportPayload.report_type,
        created_at: timestamp,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (repErr) {
      console.error('[Supabase reports error]:', repErr)
      return {
        success: false,
        id: reportId,
        predictionId,
        error: `Failed to save report: ${repErr.message}`,
        errorCode: repErr.code,
        savedLocally: true,
      }
    }

    // C. Insert into 'health_scores'
    await supabase
      .from('health_scores')
      .insert({
        user_id: user.id,
        prediction_id: predictionId,
        score: params.result.health_score,
        score_type: 'overall_health_score',
        score_data: {
          health_score: params.result.health_score,
          risk_level: params.result.risk_level,
          diabetes_risk: params.result.diabetes_risk,
          heart_risk: params.result.heart_risk,
          hypertension_risk: params.result.hypertension_risk,
          kidney_risk: params.result.kidney_risk,
        },
        created_at: timestamp,
      })
      .then(({ error }) => {
        if (error) console.warn('Could not insert health_scores:', error.message)
      })

    // D. Insert into 'health_records'
    await supabase
      .from('health_records')
      .insert({
        user_id: user.id,
        record_data: params.input,
        notes: `Assessment record: BMI ${params.input.bmi || calculateBMI(params.input.height_cm, params.input.weight_kg)}, BP ${params.input.blood_pressure_sys}/${params.input.blood_pressure_dia}`,
        created_at: timestamp,
      })
      .then(({ error }) => {
        if (error) console.warn('Could not insert health_records:', error.message)
      })

    return {
      success: true,
      id: reportId,
      predictionId,
      savedLocally: true,
    }
  } catch (err: any) {
    console.error('[saveAssessment exception]:', err)
    return {
      success: false,
      id: reportId,
      predictionId,
      error: err.message || 'An unexpected error occurred while saving the report.',
      savedLocally: true,
    }
  }
}

/**
 * Loads a health report by report ID or prediction ID.
 * Queries 'reports' first, then 'predictions', then local client cache.
 */
export async function getAssessmentById(id: string, _user?: User | null): Promise<SavedReportData | null> {
  if (!id || id === 'undefined') return null

  // 1. Try querying 'reports' table in Supabase
  try {
    const { data: rep, error: repErr } = await supabase
      .from('reports')
      .select('*')
      .or(`id.eq.${id},prediction_id.eq.${id}`)
      .maybeSingle()

    if (!repErr && rep && rep.report_data) {
      return normalizeReportData(rep.report_data, rep.id, rep.prediction_id, rep.created_at)
    }
  } catch (err) {
    console.warn('Could not query reports table:', err)
  }

  // 2. Try querying 'predictions' table in Supabase
  try {
    const { data: pred, error: predErr } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!predErr && pred) {
      const input = pred.input_data || {}
      const result = pred.result_data || {
        health_score: 0,
        risk_level: pred.risk_level || 'low',
        diabetes_risk: 0,
        heart_risk: 0,
        hypertension_risk: 0,
        kidney_risk: 0,
        recommendations: [],
      }

      // Re-run if result_data was incomplete
      if (!result.category_details && input && input.age) {
        try {
          const regenerated = runPredictions(input)
          result.category_details = regenerated.category_details
          result.health_score = result.health_score || regenerated.health_score
          result.diabetes_risk = result.diabetes_risk || regenerated.diabetes_risk
          result.heart_risk = result.heart_risk || regenerated.heart_risk
          result.hypertension_risk = result.hypertension_risk || regenerated.hypertension_risk
          result.kidney_risk = result.kidney_risk || regenerated.kidney_risk
          result.recommendations = result.recommendations?.length ? result.recommendations : regenerated.recommendations
        } catch {}
      }

      return {
        id: pred.id,
        prediction_id: pred.id,
        created_at: pred.created_at,
        health_score: result.health_score ?? 0,
        risk_level: pred.risk_level || result.risk_level || 'low',
        diabetes_risk: result.diabetes_risk ?? 0,
        heart_risk: result.heart_risk ?? 0,
        hypertension_risk: result.hypertension_risk ?? 0,
        kidney_risk: result.kidney_risk ?? 0,
        input,
        result,
        recommendations: result.recommendations || [],
        risk_factors: extractRiskFactors(result),
        category_details: result.category_details,
        title: `Health Assessment Report - ${new Date(pred.created_at).toLocaleDateString()}`,
        report_type: 'comprehensive_risk',
      }
    }
  } catch (predErr) {
    console.warn('Could not query predictions table:', predErr)
  }

  // 3. Fallback to localStorage / sessionStorage
  try {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`)
    if (local) {
      return normalizeReportData(JSON.parse(local), id, id)
    }
    const cachedLatest = sessionStorage.getItem('healthsense_latest_report')
    if (cachedLatest) {
      const parsed = JSON.parse(cachedLatest)
      if (parsed.id === id || parsed.prediction_id === id) {
        return normalizeReportData(parsed, id, id)
      }
    }
  } catch {}

  return null
}

/**
 * Lists all reports for an authenticated user from 'reports' (falling back to 'predictions')
 */
export async function listUserAssessments(user?: User | null): Promise<SavedReportData[]> {
  if (!user) return []
  const reportsMap = new Map<string, SavedReportData>()

  // 1. Fetch from 'reports' table
  try {
    const { data: reportRows, error: repErr } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!repErr && reportRows) {
      for (const row of reportRows) {
        if (row.report_data) {
          const normalized = normalizeReportData(row.report_data, row.id, row.prediction_id, row.created_at)
          reportsMap.set(row.id, normalized)
        }
      }
    }
  } catch (err) {
    console.warn('Failed listing reports:', err)
  }

  // 2. Fetch from 'predictions' table for any missing
  try {
    const { data: predRows, error: predErr } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!predErr && predRows) {
      for (const p of predRows) {
        if (!reportsMap.has(p.id)) {
          const input = p.input_data || {}
          const result = p.result_data || {
            health_score: 0,
            risk_level: p.risk_level || 'low',
            diabetes_risk: 0,
            heart_risk: 0,
            hypertension_risk: 0,
            kidney_risk: 0,
            recommendations: [],
          }
          reportsMap.set(p.id, {
            id: p.id,
            prediction_id: p.id,
            created_at: p.created_at,
            assessment_date: p.created_at,
            health_score: result.health_score ?? 0,
            risk_level: p.risk_level || result.risk_level || 'low',
            diabetes_risk: result.diabetes_risk ?? 0,
            heart_risk: result.heart_risk ?? 0,
            hypertension_risk: result.hypertension_risk ?? 0,
            kidney_risk: result.kidney_risk ?? 0,
            input,
            input_parameters: input,
            result,
            recommendations: result.recommendations || [],
            suggestions: result.recommendations || [],
            risk_factors: extractRiskFactors(result),
            category_details: result.category_details,
            title: `Health Assessment Report - ${new Date(p.created_at).toLocaleDateString()}`,
            report_type: 'comprehensive_risk',
          })
        }
      }
    }
  } catch (err) {
    console.warn('Failed listing predictions:', err)
  }

  return Array.from(reportsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

function normalizeReportData(
  raw: any,
  fallbackId?: string,
  fallbackPredId?: string,
  fallbackDate?: string
): SavedReportData {
  const input = raw.input || raw.input_data || {}
  const result = raw.result || raw.result_data || {
    health_score: raw.health_score ?? 0,
    risk_level: raw.risk_level || 'low',
    diabetes_risk: raw.diabetes_risk ?? 0,
    heart_risk: raw.heart_risk ?? 0,
    hypertension_risk: raw.hypertension_risk ?? 0,
    kidney_risk: raw.kidney_risk ?? 0,
    recommendations: raw.recommendations || [],
  }

  if (!result.category_details && input && input.age) {
    try {
      const regenerated = runPredictions(input)
      result.category_details = regenerated.category_details
      if (!result.recommendations || !result.recommendations.length) {
        result.recommendations = regenerated.recommendations
      }
    } catch {}
  }

  const createdAt = raw.created_at || raw.assessment_date || fallbackDate || new Date().toISOString()

  return {
    id: raw.id || fallbackId || crypto.randomUUID(),
    prediction_id: raw.prediction_id || fallbackPredId || raw.id || fallbackId || '',
    created_at: createdAt,
    assessment_date: createdAt,
    health_score: raw.health_score ?? result.health_score ?? 0,
    risk_level: raw.risk_level || result.risk_level || 'low',
    diabetes_risk: raw.diabetes_risk ?? result.diabetes_risk ?? 0,
    heart_risk: raw.heart_risk ?? result.heart_risk ?? 0,
    hypertension_risk: raw.hypertension_risk ?? result.hypertension_risk ?? 0,
    kidney_risk: raw.kidney_risk ?? result.kidney_risk ?? 0,
    input,
    input_parameters: input,
    result,
    recommendations: raw.recommendations || result.recommendations || [],
    suggestions: raw.recommendations || result.recommendations || raw.suggestions || [],
    risk_factors: raw.risk_factors || extractRiskFactors(result),
    category_details: raw.category_details || result.category_details,
    complete_report: raw.complete_report || raw,
    title: raw.title || `Health Assessment Report - ${new Date(createdAt).toLocaleDateString()}`,
    report_type: raw.report_type || 'comprehensive_risk',
  }
}
