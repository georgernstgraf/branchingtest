const router = require('express').Router(); // new Router
const { measureBelongsToUser, watchBelongsToUser } = require('../lib/db');
const Measurement = require('../classes/measurement');
const Watch = require('../classes/watch');
router.post('/:id', async (req, res) => {
    // this is a watchId here!!
    const watchId = req.params.id;
    const user = req.session.user;
    if (!user) {
        return res.status(401).send('Not Authenticated');
    }
    res.locals.user = user;
    if (!(await watchBelongsToUser(watchId, user))) {
        return res.status(403).send('Wrong Watch ID');
    }
    const m = new Measurement({
        watchId: watchId,
        isStart: true,
        value: 0
    });
    await Measurement.save(m);
    const watch = await Watch.userWatchWithMeasurements(user, watchId);
    /* if (!watch) {
        return res.status(403).send('Wrong Watch ID');
    } */
    res.locals.watch = watch;
    return res.render('measurements');
});
router.delete('/:id', async (req, res) => {
    const measureId = req.params.id;
    const user = req.session.user;
    if (!user) {
        return res.status(401).send('Not Authenticated');
    }
    res.locals.user = user;
    const watchId = await Measurement.watchIdForMeasureOfUser(measureId, user);
    if (!watchId) {
        return res.status(403).send('Wrong Watch ID');
    }
    await Measurement.delete(measureId);
    const watch = await Watch.userWatchWithMeasurements(user, watchId);
    if (!watch) {
        return res.status(403).send('This is not your watch');
    }
    res.locals.watch = watch;
    return res.render('measurements');
});
router.patch('/:id', async (req, res, next) => {
    try {
        const measureId = req.params.id;
        const user = req.session.user;
        if (!user) {
            return res.status(401).send('Not Authenticated');
        }
        res.locals.user = user;
        const measure = await Measurement.getUserMeasurement(user, measureId);
        if (!measure) {
            return res.status(403).send('Wrong Watch ID');
        }
        const watchId = measure['watchId'];
        measure.patch(req.body);
        await Measurement.save(measure);
        const watch = await Watch.userWatchWithMeasurements(user, watchId);
        return res.render('measurements');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
