import AppError from "../errors/AppError";
import AboutAndTerm from "../models/aboutAndTerm";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const createAboutAndTerm = catchAsync(async (req, res) => {
  try {
    const result = await AboutAndTerm.create(req.body);

    const { docType } = result;

    if (docType === "about") {
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "About us created successfully",
        data: result,
      });
    } else if (docType === "terms") {
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Terms and conditions created successfully",
        data: result,
      });
    }
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const aboutAndTermController = {
  createAboutAndTerm,
};

export default aboutAndTermController;
