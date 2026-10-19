import { Types } from 'mongoose';
import AppError from '../errors/AppError';
import AboutAndTerm from '../models/aboutAndTerm';
import catchAsync from '../utils/catchAsync';
import { policyHtml, policyType, PolicyType } from '../services/policyContent.service';

const publicDocument = (doc: any) => ({ _id: doc._id, docType: doc.docType, description: policyHtml(doc.description, false), contentFormat: 'html', createdAt: doc.createdAt, updatedAt: doc.updatedAt });
const createAboutAndTerm = catchAsync(async (req, res) => {
  const docType = policyType(req.body?.docType);
  const description = policyHtml(req.body?.description);
  const doc = await AboutAndTerm.findOneAndUpdate({ docType }, { $set: { description, docType } }, { new: true, upsert: true, runValidators: true, sort: { updatedAt: -1, _id: -1 } });
  res.json({ success: true, message: 'Content published successfully', data: publicDocument(doc) });
});
const read = (docType: PolicyType) => catchAsync(async (_req, res) => {
  const doc = await AboutAndTerm.findOne({ docType }).sort({ updatedAt: -1, _id: -1 });
  res.json({ success: true, message: 'Content fetched successfully', data: doc ? [publicDocument(doc)] : [] });
});
const updateAboutAndTerm = catchAsync(async (req, res) => {
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid content ID');
  const existing = await AboutAndTerm.findById(id);
  if (!existing) throw new AppError(404, 'Content not found');
  if (req.body?.docType !== undefined && req.body.docType !== existing.docType) throw new AppError(400, 'The content type cannot be changed');
  const description = policyHtml(req.body?.description);
  const doc = await AboutAndTerm.findByIdAndUpdate(id, { $set: { description } }, { new: true, runValidators: true });
  if (!doc) throw new AppError(404, 'Content not found');
  res.json({ success: true, message: 'Content published successfully', data: publicDocument(doc) });
});
export default { createAboutAndTerm, getAbout: read('about'), getTerms: read('terms'), updateAboutAndTerm };
