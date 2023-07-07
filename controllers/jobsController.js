import mongoose from "mongoose";
import jobsModel from "../models/jobsModel.js";
import moment from "moment";

export const createJobController = async (req, res, next) => {
  const { company, position } = req.body;

  //validation
  if (!company || !position) {
    next("Please provide all fields");
  }

  req.body.createdBy = req.user.userId;

  const job = await jobsModel.create(req.body);

  res.status(201).json({ job });
};

export const getAllJobsController = async (req, res, next) => {
  const { status, workType, search, sort } = req.query;
  //condition for searching filters
  const queryObject = {
    createdBy: req.user.userId,
  };
  //logic filters
  if (status && status !== "all") {
    queryObject.status = status;
  }
  if (workType && workType !== "all") {
    queryObject.workType = workType;
  }
  if (search) {
    queryObject.position = { $regex: search, $options: "i" };
  }

  let queryResult = jobsModel.find(queryObject);

  //sorting
  if (sort === "latest") {
    queryResult = queryResult.sort("-createdAt");
  }
  if (sort === "oldest") {
    queryResult = queryResult.sort("createdAt");
  }
  if (sort === "a-z") {
    queryResult = queryResult.sort("position");
  }
  if (sort === "z-a") {
    queryResult = queryResult.sort("-position");
  }
  //pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  queryResult = queryResult.skip(skip).limit(limit);
  //jobs count
  const totalJobs = await jobsModel.countDocuments(queryResult);
  const numOfPage = Math.ceil(totalJobs / limit);

  const jobs = await queryResult;

  // const jobs = await jobsModel.find({ createdBy: req.user.userId });

  res.status(200).json({ totalJobs, jobs, numOfPage });
};

export const updateJobController = async (req, res, next) => {
  const { id } = req.params;
  const { company, position } = req.body;

  //validation
  if (!company || !position) {
    next("Please provide all fields");
  }
  //find job
  const job = await jobsModel.findOne({ _id: id });
  //validation
  if (!job) {
    next(`No job found with this id ${id}`);
  }
  if (req.user.userId !== job.createdBy.toString()) {
    next("You are not Authorized to update this job");
    return;
  }
  const updateJob = await jobsModel.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
    runValidators: true,
  });

  //res
  res.status(200).json({ updateJob });
};

export const deleteJobController = async (req, res, next) => {
  const { id } = req.params;

  //find job
  const job = await jobsModel.findOne({ _id: id });
  //validation
  if (!job) {
    next(`No job found with this id ${id}`);
  }

  if (req.user.userId !== job.createdBy.toString()) {
    next("You are not Authorized to delete this job");
    return;
  }

  //delete job
  await job.deleteOne();

  //res
  res.status(200).json({ message: "Success, Job Deleted!" });
};

export const jobStatsController = async (req, res, next) => {
  const stats = await jobsModel.aggregate([
    // search by user jobs
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.userId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  //default stats
  const defaultStats = {
    pending: stats.pending || 0,
    reject: stats.reject || 0,
    interview: stats.interview || 0,
  };

  //monthly or yearly stats
  let monthyApplication = await jobsModel.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.userId),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  monthyApplication = monthyApplication
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MM Y");
      return { date, count };
    })
    .reverse();

  //res
  res
    .status(200)
    .json({ totalJob: stats.length, defaultStats, monthyApplication });
};
