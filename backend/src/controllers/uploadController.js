import { SUCCESS, ERROR } from '../utils/responseHelper.js';
import { ReportModel } from '../models/reportModel.js';
import multer from 'multer';

// Use memory storage for the mock
const storage = multer.memoryStorage();

// Set up multer with a 25MB file size limit
export const uploadMiddleware = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } 
}).single('file');

export const uploadFile = (req, res, next) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return ERROR(res, 'File exceeds the 25MB limit.', 400);
      }
      return ERROR(res, 'File upload error: ' + err.message, 400);
    }

    try {
      const file = req.file;
      if (!file) {
        return ERROR(res, 'No file provided.', 400);
      }

      // Check file extension
      const ext = '.' + file.originalname.split('.').pop().toLowerCase();
      const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.txt', '.csv', '.docx'];
      
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        return ERROR(res, `This file type isn't supported. Please upload a PDF, an image of a handwritten form (JPG, PNG, TIFF), or a text file (TXT, CSV, DOCX).`, 400);
      }

      // Simulate a small delay for malware scan / validation
      await new Promise(r => setTimeout(r, 600));

      // Duplicate-file detection (mock: check if title matches an existing one exactly)
      const existingReport = ReportModel.findAll().reports.find(r => r.title === `Processed: ${file.originalname}`);
      if (existingReport && req.body.force !== 'true') {
        // We will just proceed since we want to mock it simply, but log it if we wanted strict rejection.
        // For now we allow processing, mimicking the 'warning' state conceptually, or we could reject.
      }

      // Simulate OCR/NLP processing delay
      await new Promise(r => setTimeout(r, 1200));

      const isHighSps = Math.random() > 0.5;
      const reportData = {
        source: 'Upload', 
        sps_tier: isHighSps ? 'High' : 'Medium',
        sps: isHighSps ? 78 : 55,
        confidence: 0.92,
        recorded_severity: 'Medium',
        asset: 'Assam Site 1',
        title: `Processed: ${file.originalname}`,
        status: 'Awaiting Review',
        sla_hours_remaining: 12,
        narrative: `Auto-extracted narrative from uploaded file: ${file.originalname}. The system detected potential line of fire exposure.`,
        evidence_spans: [{ text: "line of fire exposure", label: "Line of Fire", verified: true }],
        energy_source: 'Mechanical',
        energy_level: 'High',
        exposure_type: 'Line of Fire',
        barrier_status: 'Degraded',
        life_saving_rule: 'Bypassing Safety Controls',
        sps_breakdown: {
          energy_score: 8,
          barrier_score: 7,
          exposure_score: 8
        }
      };

      const newReport = ReportModel.create(reportData);

      ReportModel.addAuditLog(newReport.id, {
        action: `File Uploaded and processed: ${file.originalname}`,
        user: req.headers['x-user-role'] || 'Admin'
      });

      return SUCCESS(res, newReport, 'File uploaded and processed successfully');
    } catch (processErr) {
      next(processErr);
    }
  });
};
