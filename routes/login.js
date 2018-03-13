var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

// Autentificación con gloogle
const GoogleAuth = require("google-auth-library");
const GOOGLE_CLIENT_ID = require('../config/config').GOOGLE_CLIENT_ID;
const GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;

app.post('/google', (req, res) => {

    var token = req.body.token || 'XXX';

    var client = new GoogleAuth.OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_SECRET, "");

    client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID },
        function(e, login) {
            if (e) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Token no Válido',
                    token: token,
                    errors: e
                });
            }

            var payload = login.getPayload();
            var userid = payload["sub"];

            Usuario.findOne({ email: payload.email }, (err, uusario) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar ususario - login',
                        errors: err
                    });
                }

                if (usuario) {
                    if (usuario.google === false) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Debe usuar su autenticación normal',
                            errors: err
                        });
                    } else {
                        usuario.password = ':)';

                        var token = jwt.sign({ usuario: usuario }, SEED, { expiresIn: 14400 }); // caduca en 4 horas

                        res.status(200).json({
                            ok: true,
                            usuario: usuario,
                            token: token,
                            id: usuario._id
                        });
                    }
                    // si el usuario no existe por correo
                } else {
                    var usuario = new Usuario();

                    usuario.nombre = payload.name;
                    usuario.email = payload.email;
                    usuario.password = ':)';
                    usuario.img = payload.picture;
                    usuario.google = true;

                    usuario.save((err, usuarioDB) => {
                        if (err) {
                            return res.status(500).json({
                                ok: false,
                                mensaje: 'Error a crear usuario - google',
                                errors: err
                            });
                        }

                        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // caduca en 4 horas

                        res.status(200).json({
                            ok: true,
                            usuario: usuarioDB,
                            token: token,
                            id: usuario._id
                        });
                    });
                }
            });


        });


});




// Autenticación normal
app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario en login',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear un token!!
        usuarioDB.password = ':)';
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // caduca en 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });

    });




});


module.exports = app;