// Fictional Grade 6 students supplied in student test names.docx.
export const betaStudents = [
  { username: 'Maya Thompson', Id: '6812047', gender: 'female' },
  { username: 'Aaliyah Brooks', Id: '6931752', gender: 'female' },
  { username: 'Sofia Martinez', Id: '6748391', gender: 'female' },
  { username: 'Jasmine Carter', Id: '6874215', gender: 'female' },
  { username: 'Kayla Robinson', Id: '6953084', gender: 'female' },
  { username: 'Jordan Williams', Id: '6729463', gender: 'male' },
  { username: 'Elijah Johnson', Id: '6895172', gender: 'male' },
  { username: 'Marcus Davis', Id: '6763829', gender: 'male' },
  { username: 'Caleb Anderson', Id: '6917546', gender: 'male' },
  { username: 'Isaiah Brown', Id: '6832691', gender: 'male' },
].map(student => ({ ...student, gradeLevel: 6 }));
