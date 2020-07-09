'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'userEncriptionKey';

exports.ensureAuth = (req, res, next)=>{
    var params = req.body;  
    var parametros = [];
    var comando = [];

if(params.command != null){
    parametros.push(params.command.split(','));
    parametros[0].forEach(Element =>{
        comando.push(Element);
    });
    if(comando[0] == 'LOGIN' || comando[0] == 'REGISTER'){
        next();          
        }else{
            if(!req.headers.authorization){
                console.log(comando[0]);
                return res.status(403).send({message: 'Petición sin autenticación'});   
            }else{
                var token = req.headers.authorization.replace(/['"]+/g, '');
                try{
                    var payload = jwt.decode(token, key);
                    if(payload.exp <= moment().unix()){
                    return res.status(401).send({message: 'Token expirado'});
                }
                }catch(ex){
                    return res.status(404).send({message: 'Token no valido',})
                }
                req.user = payload;
                next();
            }
        }
    }else{
        next();
    }      
}

/*exports.ensureAuthAdmin = (req, res, next)=>{
    if(!req.headers.authorization){
        return res.status(403).send({message: 'Petición sin autenticación'});
    }else{
        var token = req.headers.authorization.replace(/['"]+/g, '');
        try{
            var payload = jwt.decode(token, key);
            if(payload.exp <= moment().unix()){
                return res.status(401).send({message: 'Token expirado'});
            }else if(payload.role != 'ADMIN'){
                return res.status(401).send({message: 'No tienes permiso para esta ruta'});
            }
        }catch(ex){
            return res.status(404).send({message: 'Token no valido'})
        }

        req.user = payload;
        next();
    }
}
*/