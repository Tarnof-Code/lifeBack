const mongoose = require("mongoose");

const healthcareprofessionalSchema = mongoose.Schema({
  profession: String,
  adresse: String,
  ville: String,
  tel: String,
  category: String,
  secteur: String,
});

const HCProModel = mongoose.model(
  "healthcareprofessionals",
  healthcareprofessionalSchema
);

module.exports = { HCProModel, healthcareprofessionalSchema };
