var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
const User = require('../models/user')
const { decrypt, encrypt } = require('../utils/encryDecry')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const config = require('../config')


module.exports = {
    register: (req, res) => {
        async.waterfall([
            (nextCall) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return nextCall({ message: errors.errors[0].msg });
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                User.findOne({ email: body.email }, (err, user) => {
                    if (err) {
                        nextCall(err)
                    } else if (user) {
                        nextCall({ message: 'Email already exist.' })
                    } else {
                        nextCall(null, body)
                    }
                })
            },
            (body, nextCall) => {
                req.body.email = req.body.email.toLowerCase();
                let user = new User(body)
                user.save((err, data) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, data)
                })
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to register user. '
                })
            }

            res.json({
                status: 'success',
                message: 'User registered successfully.',
                data: response
            })
        })
    },
    login: (req, res) => {
        async.waterfall([
            (nextCall) => {
                req.body.email = req.body.email.toLowerCase();
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return nextCall({ message: errors.errors[0].msg });
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                User.findOne({ email: body.email }, (err, user) => {
                    if (err) {
                        return nextCall(err)
                    } else if (!user) {
                        return nextCall({ message: 'Please check your username and password.' })
                    } else {
                        let result = decrypt(body.password, user.password)
                        if (result) {
                            nextCall(null, user)
                        } else {
                            return nextCall({ message: 'Please check your username and password.' })
                        }
                    }
                })
            },
            (user, nextCall) => {
                let jwtData = {
                    _id: user._id,
                    email: user.email
                }
                user = user.toJSON()
                user.token = jwt.sign(jwtData, config.secret, {
                    expiresIn: 60 * 60 * 24
                })
                delete user['password']
                nextCall(null, user)
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to login. '
                })
            }

            res.json({
                status: 'success',
                message: 'User logged in successfully.',
                data: response
            })
        })
    },

    addUserScore: (req, res) => {
        async.waterfall([
            (nextCall) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) {
                        return nextCall(user)
                    }
                    nextCall(null, user)
                })
            },
            (user, nextCall) => {
                const { category, difficulty, score } = req.body
                let scoreCard = {
                    category: category,
                    difficulty: difficulty,
                    score: score,
                    played_at: moment().unix() * 1000
                }
                if (!user.scorecard) {
                    User.findByIdAndUpdate(
                        user._id,
                        {
                            scorecard: [scoreCard]
                        },
                        { new: true },
                        (err, updatedUser) => {
                            if (err) {
                                return nextCall(err)
                            }
                            nextCall(err, updatedUser)
                        })
                } else {
                    user.scorecard.push(scoreCard)
                    User.findByIdAndUpdate(
                        user._id,
                        {
                            scorecard: user.scorecard
                        },
                        { new: true },
                        (err, updatedUser) => {
                            if (err) {
                                return nextCall(err)
                            }
                            nextCall(err, updatedUser)
                        }
                    )
                }

            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops Failed to add score.'
                })
            }
            res.json({
                status: 'success',
                message: 'Score added successfully.',
                data: response
            })
        })
    },

    getUserScorecard: (req, res) => {
        async.waterfall([
            (nextCall) => {
                let aggregateQuery = [];

                aggregateQuery.push({
                    $match: {
                        _id: mongoose.Types.ObjectId(req.user._id),
                        scorecard:{$ne:[]}
                    }

                })

                aggregateQuery.push({
                    $unwind: {
                        path: '$scorecard',
                        preserveNullAndEmptyArrays: true
                    }
                })

                aggregateQuery.push({
                    $sort: {
                        "scorecard.score": -1

                    }
                })

                aggregateQuery.push({
                    $group: {
                        _id: "$scorecard.category",
                        category: { $first: "$scorecard.category" },
                        scorecard: {
                            $push: {
                                score: "$scorecard.score",
                                category: "$scorecard.category",
                                difficulty: "$scorecard.difficulty",
                                played_at: { $dateToString: { format: "%Y-%m-%d", date: "$scorecard.played_at" } }
                            }
                        }
                    }
                })

                User.aggregate(aggregateQuery).exec((err, userScorecard) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, userScorecard)
                })

            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to get user scorecard.'
                })
            }

            res.json({
                status: 'success',
                message: 'User Scorecard',
                data: response
            })
        })
    },

    getWorldScoreBoard: (req, res) => {
        async.waterfall([
            (nextCall) => {
                let aggregateQuery = [];

                aggregateQuery.push({
                    $unwind: {
                        path: "$scorecard",
                        preserveNullAndEmptyArrays: true
                    }
                })

                aggregateQuery.push({
                    $match: {
                        "scorecard.category": req.body.category
                    }
                })

                aggregateQuery.push({
                    $sort: {
                        "scorecard.score": -1
                    }
                })

                aggregateQuery.push({
                    $group: {
                        _id: "$scorecard.difficulty",
                        level: { $first: "$scorecard.difficulty" },
                        scorecard: {
                            $push: {
                                category: "$scorecard.category",
                                score: "$scorecard.score",
                                name: "$name",
                                difficulty: "$scorecard.difficulty",
                                email: "$email",
                                played_at:{ $dateToString: { format: "%Y-%m-%d", date: "$scorecard.played_at" } }
                            }
                        }
                    }
                })

                User.aggregate(aggregateQuery).exec((err, list) => {
                    if (err) {
                        return nextCall(err)
                    }

                    nextCall(null, list)
                })
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to get user scorecard.'
                })
            }

            res.json({
                status: 'success',
                message: 'World Scorecard',
                data: response
            })
        })
    }

}