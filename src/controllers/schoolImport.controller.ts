import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { importSchoolData } from '../services/schoolImport.service';
import { District } from '../models/district.model';

export const schoolDataImport = catchAsync(async (req, res) => {
  const { csv, kind, commit = false } = req.body;
  if (!['schools', 'districts'].includes(kind) || typeof commit !== 'boolean') throw new AppError(400, 'Select schools or districts and a valid preview/commit mode');
  const data = await importSchoolData(csv, kind, commit);
  res.status(200).json({ success: true, data });
});

export const listDistricts = catchAsync(async (_req, res) => {
  const data = await District.find().sort({ name: 1 }).select('name code');
  res.status(200).json({ success: true, data });
});
