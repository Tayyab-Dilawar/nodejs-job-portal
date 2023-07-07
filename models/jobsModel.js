import mongoose from "mongoose";

//schema
const jobSchema = mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Company Name is Require"],
    },
    position: {
      type: String,
      required: [true, "Job Position is Require"],
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["pending", "reject", "interview"],
      default: "pending",
    },
    workType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      default: "full-time",
    },
    workLocation: {
      type: String,
      default: "Faisalabad",
      required: [true, "Work location is Require"],
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
