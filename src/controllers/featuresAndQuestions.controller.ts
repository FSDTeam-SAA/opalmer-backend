import AppError from "../errors/AppError";
import FeaturesAndQuestions from "../models/featuresAndQuestions.model";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";

const crateFeaturesAndQuestions = catchAsync(async (req, res) => {
  try {
    const result = await FeaturesAndQuestions.create(req.body);
    const { docType } = result;

    if (docType === "AppFeatures") {
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "App Features created successfully",
        data: result,
      });
    } else if (docType === "FAQquestions") {
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "FAQ questions created successfully",
        data: result,
      });
    }
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

const getFeaturesAndQuestions = catchAsync(async (req, res) => {
  try {
    const result = await FeaturesAndQuestions.find();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Features And Questions fetched successfully",
      data: result,
    });
  } catch (error) {
    throw new AppError(500, error as string);
  }
});

export const featuresAndQuestionsController = {
  crateFeaturesAndQuestions,
  getFeaturesAndQuestions,
};
