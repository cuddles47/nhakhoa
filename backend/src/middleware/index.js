const requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        next();
    };
};

module.exports = {
    requestLogger,
    errorHandler,
    validateRequest
};