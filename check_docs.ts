import mongoose from 'mongoose';
import AcademicDocument from './src/models/academicDocument.model';
import dotenv from 'dotenv';

dotenv.config();

async function checkDocs() {
  await mongoose.connect(process.env.MONGO_URI!);
  const docs = await AcademicDocument.find();
  console.log('Total Academic Documents:', docs.length);
  console.log('Docs:', JSON.stringify(docs, null, 2));
  await mongoose.disconnect();
}

checkDocs();
