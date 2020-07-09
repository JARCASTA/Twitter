'use strict'

var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');

function commands(req, res){
    var user = new User();
    var tweet = new Tweet();
    var params = req.body;  
    var parametros = [];
    var comando = [];

    if(params.command != null){
        
        parametros.push(params.command.split(','));

        parametros[0].forEach(Element =>{
            comando.push(Element);
        } );

        if(comando[0] == 'ADD_TWEET'){
            var userId = req.user.sub;
            if(comando[1] != null){
                tweet.text = comando[1];
                tweet.author = userId;

                tweet.save((err ,tweetSaved)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor'});
                    }else if(tweetSaved){
                        User.findByIdAndUpdate(userId,{$push:{tweets:tweetSaved._id}},{new:true},(err, userAddTweet)=>{
                            if(err){
                                res.status(500).send({message:'Error del servidor'});
                            }else if(userAddTweet){
                                res.send({message:'Tweet publicado'});
                            }else{
                                res.send({message:'Error inesperado'});
                            }
                        })
                    }else{
                        res.send({message:'Error inesperado'});
                    }
                })
            }else{
                res.send({message:'El tweet esta vacio'});
            }

        }else if(comando[0] == 'DELETE_TWEET'){
            userId = req.user.sub;
            if(comando[1] != null){
                Tweet.findById(comando[1],(err,tweetFinded)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor'});
                    }else if(tweetFinded){
                        if(tweetFinded.author == userId){
                            Tweet.findByIdAndDelete(comando[1],(err, tweetDeleted)=>{
                                if(err){
                                    res.status(500).send({message:'Error del servidor'});
                                }else if(tweetDeleted){
                                    User.findByIdAndUpdate(userId,{$pull:{tweets:comando[1]}},(err, tweetPulled)=>{
                                        if(err){
                                            res.status(500).send({message:'Error del servidor'});
                                        }else if(tweetPulled){
                                            res.send({message:'Tweet borrado con exito'});
                                        }else{
                                            res.send({message:'Error inesperado'});
                                        }
                                    })
                                }else{
                                    res.send({message:'Error inesperado'});
                                }
                            })
                        }else{
                            res.send({message:'No puede borrar este Tweet'});
                        }
                    }else{
                        res.send({message:'Tweet no encontrado'})
                    }
                })
                
            }else{
                res.send({message:'No hay ID de tweet'});
            }

        }else if(comando[0] == 'EDIT_TWEET'){
            var userId = req.user.sub;
            if(comando[1] != undefined && comando [2] != undefined){
                Tweet.findById(comando[1],(err, tweetFinded)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor',err});
                    }else if(tweetFinded){
                        if(tweetFinded.author == userId){
                            Tweet.findByIdAndUpdate(comando[1],{text:comando[2]},(err,tweetUpdated)=>{
                                if(err){
                                    res.status(500).send({message:'Error del servidor',err});
                                }else if(tweetUpdated){
                                    res.send({message:'Tweet actualizado con exito'});
                                }else{
                                    res.send({message:'Error inesperado'});
                                }
                            })
                        }else{
                            res.send({message:'No puede editar este tweet'});
                        }
                    }else{
                        res.send({message:'No se encontro el tweet'});
                    }
                })
            }else{
                res.send({message:'Faltan parametros'});
            }
        }else if(comando[0] == 'VIEW_TWEETS'){
            var userId = req.user.sub;
            if(comando[1] != undefined){
                User.findOne({username:comando[1]},(err, userFinded)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor'});
                    }else if(userFinded){
                        res.send({Tweets:userFinded.tweets,
                            UserName:userFinded.username});
                    }else{
                        res.send({message:'Error inesperado'});
                    }
                }).populate({path:'tweets', select:'-_id -author -__v'});
            }else{
                res.send({message:'Faltan parametros'});
            }
        }else if(comando[0] == "FOLLOW"){
            userId = req.user.sub;
            if(comando[1] != undefined){ 
                User.findOne({username:comando[1]},(err,userFinded)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor'});
                    }else if(userFinded){
                        User.findOne({following:userFinded._id},(err,followingFinded)=>{
                            if(err){
                                res.send({message:'Error del servidor'});
                            }else if(followingFinded){
                                res.send({message:'Ya sigue a este usuario'});
                            }else{
                                if(userFinded._id != userId){
                                    User.findByIdAndUpdate({_id:userId},{$push:{following:userFinded}},(err, follow)=>{
                                        if(err){
                                            res.status(500).send({message:'Error del servidor'});
                                        }else if(follow){
                                            User.findByIdAndUpdate({_id:userFinded._id},{$push:{followers:follow}},(err,follower)=>{
                                                if(err){
                                                    res.status(500).send({message:'Error del servidor'});
                                                }else if(follower){
                                                    res.send({message:'Siguiendo al usuario: '+ userFinded.username});
                                                }else{
                                                    res.send({message:'Error inesperado'});
                                                }
                                            })
                                        }else{
                                            res.send({message:'Error inesperado'});
                                        }
                                    }) 
                                }else{
                                    res.send({message:'No se puede seguir a usted mismo'});
                                }                                     
                            }
                        })
                        
                    }else{
                        res.send({message:'Error inesperado'});
                    }
                })
            }else{
                res.send({message:'Faltan parametros'});
            }

        }else if(comando[0] == 'UNFOLLOW'){
            userId = req.user.sub;
            if(comando[1] != undefined){
                User.findOne({_id:userId},(err,userFinded)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor'});
                    }else if(userFinded){
                        User.findOne({username:comando[1]},(err,user2Finded)=>{
                            if(err){
                                res.status(500).send({message:'Error del servidor'});
                            }else if(user2Finded){
                                User.findOne({following:user2Finded._id},(err, following)=>{
                                    if(err){
                                        res.status(500).send({message:'Error del servidor'});
                                    }else if(following){
                                        User.findByIdAndUpdate({_id:userId},{$pull:{following:user2Finded._id}},(err,unfollow)=>{
                                            if(err){
                                                res.status(500).send({message:'Error del servidor'});
                                            }else if(unfollow){
                                                User.findByIdAndUpdate({_id:user2Finded._id},{$pull:{followers:userId}},(err,unfollower)=>{
                                                    if(err){
                                                        res.send({message:'Error del servidor'});
                                                    }else if(unfollower){
                                                        res.send({message:'Se dejo de seguir al usuario'});
                                                    }else{
                                                        res.send({message:'Error inesperado'});
                                                    }
                                                })
                                            }else{
                                                res.send({message:'Error inesperado'});
                                            }
                                        })
                                    }else{
                                        res.send({message:'No se sigue a este usuario'});
                                    }
                                })
                            }else{
                                res.send({message:'Error inesperado'});
                            }
                        })
                    }else{
                        res.send({message:'Error inesperado'});
                    }
                })
            }
        }else if(comando[0] == 'PROFILE'){
            if(comando[1] != undefined){
                User.findOne({username:comando[1]},(err,userFinded)=>{
                    if(err){
                        res.status(500).send({message:'Error del servidor'});
                    }else if(userFinded){
                            res.send({Nombre:userFinded.name,
                            NombreDeUsuario:userFinded.username,
                            Email:userFinded.email,
                            Seguidores:userFinded.followers.length,
                            Siguiendo:userFinded.following.length,
                            Tweets:userFinded.tweets})          
                    }else{
                        res.send({message:'Error inesperado'});
                    }
                }).populate({path:'tweets', select:'-_id -author -__v'});
            }else{
                res.send({message:'Faltan parametros'});
            }
        }else if(comando[0] == 'REGISTER' && comando[1] != undefined && comando[2] != undefined && comando[3] != undefined && comando[4] != undefined){

            User.findOne({$or:[{email: comando[2]},{username: comando[3]}]}, (err, userFinded)=>{
                if(err){
                    res.status(500).send({message:'Error del servidor'}); 
                }else if(userFinded){
                    res.send({message:'Correo o nombre de usuario ya en uso'});
                }else{           
                    user.name = comando[1];
                    user.email = comando[2];
                    user.username = comando[3];
                    user.role = 'USER';
                    bcrypt.hash(comando[4], null, null,(err, passwordHashed)=>{
                        if(err){
                            res.status(500).send({message:'Error del servidor'});
                        }else if(passwordHashed){
                            user.password = passwordHashed;
                            user.save((err, userSaved)=>{
                                if(err){                                   
                                    res.status(500).send({message:'Error del servidor'});                   
                                }else if(userSaved){
                                    res.send({message:'Usuario registrado con exito: ' + userSaved.name + " , " + userSaved.email + " , " + userSaved.username });
                                }else{                  
                                    res.send({message:'Usuario no guardado, error inesperado'});
                                }
                            })
                        }else{
                            res.status(418).send({message:'Error no esperado'});
                        }
                    })

                }
            })

        }else if(comando[0] == 'LOGIN'){
            if(comando[1] != undefined){
                if(comando[2] != undefined){
                    User.findOne({$or:[{username: comando[1]},{email:comando[1]}]},(err,userFinded)=>{
                        if(err){
                            res.status(500).send({message:'Error en el servidor'});
                        }else if(userFinded){
                            bcrypt.compare(comando[2], userFinded.password,(err,correctPassword)=>{
                                if(err){
                                    res.status(500).send({message:'Error en el servidor'});
                                }else if(correctPassword){
                                    res.send({token: jwt.createToken(userFinded), user: userFinded.name});
                                }else{
                                    res.send({message:'Datos incorrectos'});
                                }
                            })
                        }else{
                            res.send({message:'Datos incorrectos'});
                        }
                    })
                }else{
                    res.send({message:'Ingrese una contraseña'});
                }
            }else{
                res.send({message:'Ingrese un nombre de usuario o correo'});
            }

        }else{

            res.send({message:'Ayuda para los comandos:',
            comando1:'REGISTER,name,email,username,password',
            comando2:'LOGIN,(username o email),password',
            comando3:'ADD_TWEET,texto',
            comando4:'DELETE_TWEET,idTweet',
            comando5:'EDIT_TWEET,idTweet,texto',
            comando6:'VIEW_TWEETS,username',
            comando7:'FOLLOW,username',
            comando8:'UNFOLLOW,username',
            comando9:'PROFILE,username',
            tip:'Recuerde que los parametros se separan con comas(,)',
            tip2:'No deje espacio despues de la coma(,)'
        },
        );
    
        }

        
    }else{
        res.send({Ayuda:'el parametro es debe de ser: command'});
    }
}

module.exports = {
    commands
};