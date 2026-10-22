import mongoose from "mongoose";
import AppError from "../errors/AppError";
import { User } from "../models/user.model";
import school from "../models/school.model";
import { disconnectUser } from "../services/realtime.service";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

export const deleteAdministrator = catchAsync(async (req, res) => {
  if (req.user?.role !== "admin") throw new AppError(403, "Only admins can delete administrators");
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, "Invalid administrator ID");
  const target = await User.findOne({ _id: id, role: "administrator" });
  if (!target) throw new AppError(404, "Administrator not found");

  // Release the school assignment without deleting its school or users.
  await school.updateMany({ administrator: target._id }, { $unset: { administrator: "" } });
  await User.findOneAndDelete({ _id: target._id, role: "administrator" });
  disconnectUser(String(target._id));
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Administrator deleted successfully",
    data: null,
  });
});
