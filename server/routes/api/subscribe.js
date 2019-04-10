const express = require('express');
const router = express.Router();
const validations = require('../../modules/subscribe/subscribeValidation');
const { authorization, authentication } = require('../../middleware/authentication.middleware');
const subscribeModule = require('../../modules/subscribe/subscribeController');

router.get('/', authorization, subscribeModule.GetSubscribe);
router.get('/:id', authorization, subscribeModule.GetSubscribeById);
router.post('/', validations.sanitize, validations.validate, subscribeModule.SaveSubscribe);
module.exports = router;