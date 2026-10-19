import { Attendance } from "../models/attendance.model";
import { Quiz } from "../models/quiz.model";
import { QuizResult } from "../models/quizResult.model";
import { StuAssignToClass } from "../models/stuAssignToClass.model";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppError";
import { analysisRange } from "../services/classMetrics.service";

export const getSingleStudentAnalysisController = catchAsync(async (req, res) => {
  const { classId, studentId } = req.params;
  const { filter, start, end, buckets } = analysisRange(String(req.query.filter ?? "weekly"));
  if (!await StuAssignToClass.exists({ classId, studentId })) {
    throw new AppError(404, "Student not enrolled in this class");
  }
  const quizzes = await Quiz.find({ classId }).distinct("_id");
  const [attendance, results] = await Promise.all([
    Attendance.find({ classId, userId: studentId, date: { $gte: start, $lte: end } }).lean(),
    QuizResult.find({
      studentId, quizId: { $in: quizzes }, "progress.status": "completed",
      gradeStatus: { $in: req.user?.type === 'teacher' || ['admin', 'administrator'].includes(req.user?.role ?? '') ? ["reviewed", "released"] : ["released"] },
      submittedAt: { $gte: start, $lte: end },
    }).select("percentage submittedAt").lean(),
  ]);
  const chartData = buckets.map(bucket => ({ label: bucket.label, present: 0, absent: 0 }));
  const performanceChartData = buckets.map(bucket => ({ label: bucket.label, percentage: null as number | null, resultCount: 0, total: 0 }));
  for (const row of attendance) {
    const index = buckets.findIndex(bucket => bucket.key === new Date(row.date).toISOString().slice(0, 10));
    if (index < 0) continue;
    const status = String(row.status).toLowerCase();
    if (status === "present") chartData[index].present++;
    if (status === "absent") chartData[index].absent++;
  }
  for (const row of results) {
    if (typeof row.percentage !== "number" || !Number.isFinite(row.percentage) || row.percentage < 0 || row.percentage > 100 || !row.submittedAt) continue;
    const index = buckets.findIndex(bucket => bucket.key === new Date(row.submittedAt!).toISOString().slice(0, 10));
    if (index < 0) continue;
    const point = performanceChartData[index];
    point.resultCount++;
    point.total += row.percentage;
    point.percentage = Math.round(point.total / point.resultCount);
  }
  const present = chartData.reduce((total, point) => total + point.present, 0);
  const absent = chartData.reduce((total, point) => total + point.absent, 0);
  const resultCount = performanceChartData.reduce((total, point) => total + point.resultCount, 0);
  const totalPercentage = performanceChartData.reduce((total, point) => total + point.total, 0);
  res.json({ success: true, data: {
    studentId, classId, filter,
    summary: { totalDays: present + absent, present, absent, percentage: present + absent ? ((present / (present + absent)) * 100).toFixed(2) : null },
    chartData,
    performanceSummary: { resultCount, percentage: resultCount ? Math.round(totalPercentage / resultCount) : null },
    performanceChartData: performanceChartData.map(({ total, ...point }) => point),
  } });
});
