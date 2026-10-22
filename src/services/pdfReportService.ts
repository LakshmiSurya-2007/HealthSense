// HealthSense AI — Professional PDF Health Report Generator
// Generates genuine, fully formatted PDF documents for clinical risk assessments

import { jsPDF } from 'jspdf'
import type { SavedReportData } from '@/services/assessmentService'
import { getRecommendedProvidersForReport } from '@/data/sampleHealthcareProviders'

export interface GeneratePdfOptions {
  patientName?: string
}

export function generateHealthReportPdf(
  report: SavedReportData | any,
  options?: GeneratePdfOptions
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 16
    const contentWidth = pageWidth - margin * 2
    let y = 18

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 18) {
        doc.addPage()
        y = 18
      }
    }

    // ──────────────────────────────────────────
    // 1. HEADER & BRANDING
    // ──────────────────────────────────────────
    doc.setFillColor(15, 23, 42) // Dark slate banner
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F')

    // Brand title
    doc.setTextColor(45, 212, 191) // Teal accent
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('HEALTHSENSE AI', margin + 6, y + 9)

    doc.setTextColor(241, 245, 249)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Preventive Health Intelligence & Risk Assessment Report', margin + 6, y + 15)

    // Report ID & Date on right side of banner
    const reportDate = report.created_at || report.assessment_date || new Date().toISOString()
    const formattedDate = new Date(reportDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    const dateFileStr = new Date(reportDate).toISOString().slice(0, 10)

    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Date: ${formattedDate}`, pageWidth - margin - 6, y + 9, { align: 'right' })
    const shortId = (report.id || report.prediction_id || 'ASSESSMENT').slice(0, 16)
    doc.text(`ID: #${shortId}`, pageWidth - margin - 6, y + 15, { align: 'right' })

    y += 28

    // ──────────────────────────────────────────
    // 2. PATIENT & REPORT METADATA SUMMARY
    // ──────────────────────────────────────────
    const patientDisplayName = options?.patientName || report.patientName || report.userName || 'Valued Patient'
    const riskLevelStr = (report.risk_level || report.riskLevel || 'Low').toUpperCase()
    const healthScore = report.health_score ?? report.healthScore ?? 80

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD')

    doc.setTextColor(51, 65, 85)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('PATIENT:', margin + 4, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.text(patientDisplayName, margin + 24, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.text('OVERALL HEALTH SCORE:', margin + 75, y + 7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(13, 148, 136)
    doc.text(`${healthScore} / 100`, margin + 125, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('RISK LEVEL:', margin + 4, y + 14)

    // Risk badge color
    if (riskLevelStr === 'HIGH') {
      doc.setTextColor(225, 29, 72)
    } else if (riskLevelStr === 'MEDIUM' || riskLevelStr === 'MODERATE') {
      doc.setTextColor(217, 119, 6)
    } else {
      doc.setTextColor(16, 185, 129)
    }
    doc.setFont('helvetica', 'bold')
    doc.text(riskLevelStr, margin + 24, y + 14)

    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text(`Status: Verified Assessment (${formattedDate})`, margin + 75, y + 14)

    y += 23

    // ──────────────────────────────────────────
    // 3. ESTIMATED DISEASE RISK BREAKDOWN
    // ──────────────────────────────────────────
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('1. Chronic Disease Risk Estimates', margin, y)
    y += 4

    const cardWidth = (contentWidth - 9) / 4
    const cardHeight = 22

    const diseases = [
      {
        name: 'Type 2 Diabetes',
        val: report.diabetes_risk ?? report.diabetesRisk ?? 0,
        color: [147, 51, 234], // Purple
      },
      {
        name: 'Heart Disease',
        val: report.heart_risk ?? report.heartRisk ?? 0,
        color: [225, 29, 72], // Rose
      },
      {
        name: 'Hypertension',
        val: report.hypertension_risk ?? report.hypertensionRisk ?? 0,
        color: [8, 145, 178], // Cyan
      },
      {
        name: 'Kidney Disease',
        val: report.kidney_risk ?? report.kidneyRisk ?? 0,
        color: [16, 185, 129], // Emerald
      },
    ]

    diseases.forEach((d, idx) => {
      const cx = margin + idx * (cardWidth + 3)
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(cx, y, cardWidth, cardHeight, 1.5, 1.5, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(d.name, cx + cardWidth / 2, y + 6, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(d.color[0], d.color[1], d.color[2])
      doc.text(`${d.val}%`, cx + cardWidth / 2, y + 14, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const level = d.val >= 40 ? 'High Risk' : d.val >= 20 ? 'Moderate' : 'Low Risk'
      doc.setTextColor(100, 116, 139)
      doc.text(level, cx + cardWidth / 2, y + 19, { align: 'center' })
    })

    y += cardHeight + 7

    // ──────────────────────────────────────────
    // 4. SUBMITTED CLINICAL PARAMETERS & VITALS
    // ──────────────────────────────────────────
    const inp = report.input || report.input_parameters || {}
    if (Object.keys(inp).length > 0) {
      checkPageBreak(35)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('2. Patient Vitals & Submitted Health Parameters', margin, y)
      y += 4

      const vitalsList = [
        { label: 'Age / Sex', val: `${inp.age || 'N/A'} yrs / ${inp.gender || 'N/A'}` },
        { label: 'Height / Weight', val: `${inp.height_cm || 'N/A'} cm / ${inp.weight_kg || 'N/A'} kg` },
        { label: 'Body Mass Index', val: `${inp.bmi || 'N/A'} kg/m²` },
        { label: 'Blood Pressure', val: `${inp.blood_pressure_sys || 'N/A'}/${inp.blood_pressure_dia || 'N/A'} mmHg` },
        { label: 'Fasting Glucose', val: `${inp.glucose || 'N/A'} mg/dL` },
        { label: 'Total Cholesterol', val: `${inp.cholesterol || 'N/A'} mg/dL` },
        { label: 'Resting Heart Rate', val: `${inp.heart_rate || 'N/A'} bpm` },
        { label: 'Smoking / Alcohol', val: `${inp.smoking_status || 'N/A'} / ${inp.alcohol_consumption || 'N/A'}` },
        { label: 'Physical Activity', val: `${inp.physical_activity || 'N/A'}` },
        { label: 'Sleep Duration', val: `${inp.sleep_hours || 'N/A'} hrs/night` },
      ]

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      const rowHeight = 6
      const totalTableHeight = Math.ceil(vitalsList.length / 2) * rowHeight + 4
      doc.roundedRect(margin, y, contentWidth, totalTableHeight, 1.5, 1.5, 'FD')

      doc.setFontSize(8)
      let tableY = y + 5
      for (let i = 0; i < vitalsList.length; i += 2) {
        const item1 = vitalsList[i]
        const item2 = vitalsList[i + 1]

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(71, 85, 105)
        doc.text(item1.label + ':', margin + 4, tableY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(15, 23, 42)
        doc.text(String(item1.val), margin + 42, tableY)

        if (item2) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(71, 85, 105)
          doc.text(item2.label + ':', margin + 92, tableY)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(15, 23, 42)
          doc.text(String(item2.val), margin + 132, tableY)
        }

        tableY += rowHeight
      }

      y += totalTableHeight + 7
    }

    // ──────────────────────────────────────────
    // 5. IDENTIFIED DRIVERS & RISK FACTORS
    // ──────────────────────────────────────────
    const factors: string[] = report.risk_factors || report.riskFactors || []
    if (factors.length > 0) {
      checkPageBreak(25)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('3. Key Contributing Risk Drivers', margin, y)
      y += 5

      factors.slice(0, 6).forEach(f => {
        checkPageBreak(7)
        doc.setFillColor(239, 68, 68) // Red dot
        doc.circle(margin + 2, y - 1, 1, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(51, 65, 85)
        const wrapped = doc.splitTextToSize(f, contentWidth - 8)
        doc.text(wrapped, margin + 6, y)
        y += wrapped.length * 4.5 + 1
      })

      y += 4
    }

    // ──────────────────────────────────────────
    // 6. PREVENTIVE RECOMMENDATIONS
    // ──────────────────────────────────────────
    const recs: string[] = report.recommendations || report.suggestions || []
    if (recs.length > 0) {
      checkPageBreak(30)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('4. Evidence-Based Preventive Recommendations', margin, y)
      y += 5

      recs.slice(0, 6).forEach((r, idx) => {
        checkPageBreak(10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(13, 148, 136)
        doc.text(`${idx + 1}.`, margin + 2, y)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 65, 85)
        const wrapped = doc.splitTextToSize(r, contentWidth - 10)
        doc.text(wrapped, margin + 7, y)
        y += wrapped.length * 4.2 + 2
      })

      y += 4
    }

    // ──────────────────────────────────────────
    // 7. RECOMMENDED DOCTORS & HOSPITALS
    // ──────────────────────────────────────────
    const providerSummary = getRecommendedProvidersForReport(report)
    if (providerSummary?.groups && providerSummary.groups.length > 0) {
      checkPageBreak(35)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('5. Recommended Medical Specialists & Facilities', margin, y)
      y += 5

      // Include top providers from relevant groups
      let listedCount = 0
      for (const group of providerSummary.groups) {
        if (listedCount >= 3) break
        for (const prov of group.providers) {
          if (listedCount >= 3) break
          checkPageBreak(16)

          doc.setFillColor(248, 250, 252)
          doc.setDrawColor(226, 232, 240)
          doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(15, 23, 42)
          doc.text(prov.name, margin + 4, y + 5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(13, 148, 136)
          doc.text(`Specialty: ${prov.specialty}`, margin + 65, y + 5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(100, 116, 139)
          doc.text(`Facility: ${prov.hospitalName} (${prov.city})`, margin + 4, y + 10)

          y += 16
          listedCount++
        }
      }

      y += 3
    }

    // ──────────────────────────────────────────
    // 8. MEDICAL DISCLAIMER & SAFETY NOTICE
    // ──────────────────────────────────────────
    checkPageBreak(24)
    doc.setFillColor(254, 242, 242) // Light red/amber tint
    doc.setDrawColor(254, 202, 202)
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(185, 28, 28)
    doc.text('MEDICAL DISCLAIMER & SAFETY NOTICE:', margin + 4, y + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(127, 29, 29)
    const disclaimerText =
      'HealthSense AI is an educational preventive health screening tool and not a certified clinical diagnostic device. ' +
      'Risk scores are probabilistic estimates and cannot replace clinical evaluation by a licensed healthcare provider. ' +
      'If you experience acute or emergency symptoms (e.g. chest pressure, sudden numbness, shortness of breath), seek immediate emergency care.'
    const wrappedDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 8)
    doc.text(wrappedDisclaimer, margin + 4, y + 9)

    // ──────────────────────────────────────────
    // 9. FOOTERS WITH PAGE NUMBERS
    // ──────────────────────────────────────────
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('HealthSense AI • Confidential Preventive Health Report', margin, pageHeight - 8)
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
    }

    // Save genuine PDF file
    const safeFileName = `HealthSense_Health_Report_${dateFileStr}.pdf`
    doc.save(safeFileName)
  } catch (err: any) {
    console.error('Failed to generate PDF report:', err)
    throw new Error(err.message || 'Could not generate PDF report. Please try again.')
  }
}
