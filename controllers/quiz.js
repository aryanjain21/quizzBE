var async = require('async');
const { Quiz } = require('../models');
const fetch = require('node-fetch');

let _self = {
    importQuiz: (req, res) => {
        async.waterfall([
            (nextCall) => {
                let url = ""
                fetch(url)
                    .then((res) => res.json())
                    .then(quiz => {
                        quiz.results.map(q => {
                            q.incorrect_answers.push(q.correct_answer)
                            q.options = q.incorrect_answers
                            q.category = 'Books'
                        })

                        Quiz.create(quiz.results, (err, data) => {
                            if (err) {
                                return nextCall(err)
                            }
                            nextCall(null, data)
                        })

                    })
                    .catch(err => {
                        return nextCall(err)
                    })
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to import quiz.'
                })
            }

            res.json({
                status: 'success',
                message: 'Quiz imported successfully.',
                data: response
            })
        })
    },

    shuffleArray: (array) => {
        for (let i = array.length - 1; i > 0; i--) {

            // Generate random number
            let j = Math.floor(Math.random() * (i + 1));

            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }

        return array;
    },

    getQuiz: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.category && !req.body.diffculty) {
                    nextCall({
                        message: 'Category and Diffculty is required.'
                    })
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                Quiz.find({ category: body.category, difficulty: body.diffculty }, (err, quiz) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, quiz)
                })
            },
            (quiz, nextCall) => {
                quiz.map(q => {
                    q.options = _self.shuffleArray(q.options)
                })
                quiz = _self.shuffleArray(quiz)
                nextCall(null, quiz)
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to get quiz.'
                })
            }

            res.json({
                status: 'success',
                message: 'Quiz',
                data: response
            })
        })
    }
}

module.exports = _self