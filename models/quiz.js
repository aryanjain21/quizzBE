const { Schema,model } = require('mongoose')
const moment = require('moment');
const { encrypt } = require('../utils/encryDecry')

const quizSchema = new Schema({

    question: {
        type: String
    },
    difficulty:{
       type: String
    },
    category:{
       type: String
    },
    correct_answer:{
        type: String
    },
    options:{
        type: Array
    }
}, { collection: 'quiz' })



module.exports = model(quizSchema.options.collection,quizSchema)