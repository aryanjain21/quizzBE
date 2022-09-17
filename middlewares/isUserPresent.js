const { User } = require('../models');

module.exports = (req, res, next) => {
    if (!req.user || (!req.user && !req.user._id)) {
        return res.status(401).json({
            message: 'Invalid user.'
        })
    }

    User.findById(req.user._id, (err, user) => {
        if (err) {
            return res.status(500).json({
                message: 'Server error.'
            })
        } else if (!user) {
            return res.status(401).json({
                message: 'Invalid user.'
            })
        } else {
            next()
        }
    })
}