const mongoose = require('mongoose')

const medicalTestSchema = mongoose.Schema({
  name: String,
  description: String,
  frequence: String,
  startDate: Date,
  endDate: Date,
  priority: String,
  status: String,
  doneDate: Date,
  meetDate: Date,
  sex: String,
  profession: String,
  createdAt: { type: Date, default: Date.now() }
})

const medicalTestModel = mongoose.model('medicaltests', medicalTestSchema)

module.exports = { medicalTestModel, medicalTestSchema }