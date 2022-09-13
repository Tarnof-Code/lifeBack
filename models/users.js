const mongoose = require("mongoose");
var { vaccineSchema } = require("./vaccines");
var { medicalTestSchema } = require("./medicalTests");
var { illnessSchema } = require("./illnesses");

const userSchema = mongoose.Schema({
  mail: String,
  password: String,
  firstname: String,
  lastname: {
    type: String,
    required: true,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  profession: {
    type: String,
    required: true,
  },
  sex: {
    type: String,
    required: true,
  },
  token: String,
  //Que faire en front quand c'est la création du compte de la personne elle-même?
  relationship: String,
  illnesses: [illnessSchema],
  familyHistory: [illnessSchema],
  vaccines: [vaccineSchema],
  medicalTests: [medicalTestSchema],
  family: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  addressBook: [
    { type: mongoose.Schema.Types.ObjectId, ref: "healthcareprofessionals" },
  ],
  createdAt: { type: Date, default: Date.now() },
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
