const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');

router.post('/', spaceController.createSpace);
router.get('/', spaceController.getSpaces);
router.put('/:id', spaceController.updateSpace);
router.delete('/:id', spaceController.deleteSpace);
router.patch('/:id/inactive', spaceController.setInactive);

module.exports = router;
