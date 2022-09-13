const mongoose = require('mongoose')

const illnessSchema = mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now() }
})

const illnessModel = mongoose.model('illnesses', illnessSchema)

module.exports = { illnessModel, illnessSchema }