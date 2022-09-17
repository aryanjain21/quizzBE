var express = require('express');
const router = express.Router();
const isUserAuthenticated = require('../middlewares/userAuthenticated');
const isUserPresent = require('../middlewares/isUserPresent');
const QuizController = require('../controllers/quiz');
const UserController = require('../controllers/user');

router.all('*/api/*', isUserAuthenticated, isUserPresent);

// User Controller
router.post('/user/auth/register', UserController.register);
router.post('/user/auth/login', UserController.login);
router.post('/user/api/add_user_score', UserController.addUserScore);
router.get('/user/api/get_user_scorecard', UserController.getUserScorecard);

// Quiz Controller
router.post('/quiz/api/get_quiz', QuizController.getQuiz);
router.post('/quiz/auth/get_world_scoreboard', UserController.getWorldScoreBoard);

module.exports = router;
