import userModel from "../models/userModel.js";

export const updateUserController = async (req, res) => {
  const { name, lastName, email, location } = req.body;

  //validate
  if (!name || !email || !lastName || !location) {
    next("Please provide all fields");
  }

  const user = await userModel.findOne({ _id: req.user.userId });
  user.name = name;
  user.lastName = lastName;
  user.email = email;
  user.location = location;

  await user.save();

  //token
  const token = user.createJWT();
  res.status(200).json({
    user,
    token,
  });
};
