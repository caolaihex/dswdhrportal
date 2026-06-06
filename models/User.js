import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: String,
    password: String,

    firstName: String,
    lastName: String,
    firstname: String,
    lastname: String,
    first_name: String,
    last_name: String,

    role: String,

    gender: String,
    birthday: String,
    age: String,
    address: String,
    profileImage: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema, "users");

export default User;