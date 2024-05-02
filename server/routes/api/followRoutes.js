const express = require('express');
const UserFollows = require('../../models/UserFollows'); // corrected model import
const router = express.Router();

// Endpoint to get follow status
router.get('/status/:userEmail', async (req, res) => {
    try {
        const follows = await UserFollows.findOne({ userEmail: req.params.userEmail });
        if (!follows) {
            return res.status(404).send('Follow record not found');
        }
        res.json(follows.follows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving follow status');
    }
});

// Endpoint to initiate follow status for a new user
router.post('/initiate-follows/:userEmail', async (req, res) => {
    try {
        // Check if the record already exists
        let follows = await UserFollows.findOne({ userEmail: req.params.userEmail });
        if (follows) {
            return res.status(400).send('Follow record already exists');
        }

        // Create new follow record if it doesn't exist
        follows = new UserFollows({
            userEmail: req.params.userEmail,
            follows: {
                pop: false, classical: false, country: false, electronic: false,
                hiphop: false, indie: false, kpop: false, metal: false,
                rnb: false, rock: false,
            }
        });
        await follows.save();
        res.status(201).json(follows.follows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating follow record');
    }
});

// Endpoint to update follow
router.post('/follow/:userEmail', async (req, res) => {
    const { community, followStatus } = req.body;
    try {
        const user = await UserFollows.findOneAndUpdate(
            { userEmail: req.params.userEmail },
            { $set: { [`follows.${community}`]: followStatus } },
            { new: true }
        );
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user.follows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating follow status');
    }
});

// Endpoint to update un-follow
router.post('/un-follow/:userEmail', async (req, res) => {
    const { community, followStatus } = req.body;
    try {
        const user = await UserFollows.findOneAndUpdate(
            { userEmail: req.params.userEmail },
            { $set: { [`follows.${community}`]: followStatus } },
            { new: false }
        );
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user.follows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating follow status');
    }
});

module.exports = router;