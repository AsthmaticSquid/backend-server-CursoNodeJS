var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

// Verificar token - se pone aquí, pq todos los métodos a continuación usan esta validación
exports.verificaToken = function(req, res, next) {

    var token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'token incorrecto',
                errors: err
            });
        }

        req.usuario = decoded.usuario;

        next();

    });
}