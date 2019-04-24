'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{_id: false,
         description: {type: String, required: true},
         duration: {type: Number, required: true},
         date: Date}]
  
});
const User = mongoose.model("User", userSchema);

function createUser(req, res, done){
  const un = req.body.username;
  User.findOne({username: un}, (err, data) => {
    if (err) return done(err);
    if (data){
      res.send("Username taken");
    }
    else{
      const u = new User({username: un, count: 0, log: []});
      u.save((err, data) => {
        if (err) return done(err);
        res.json({userId: data._id, username: data.username});
        done(null, data);
      });
    }
  });
}

function addExercise(req, res, done){
  const date = (req.body.date) ? new Date(req.body.date) : new Date();
  User.findById(req.body.userId, (err, data) => {
    if (err) return done(err);
    data.log.push({description: req.body.description, duration: req.body.duration, date: date});
    data.count = data.count + 1;
    data.save((err, data) => {
      if (err) return done(err);
      res.json(data);
      done(null, data);
    });
  });
}

function getUsers(req, res, done){
  User.find().select('-log -count -__v').exec((err, data) => {
    if (err) return done(err);
    res.json(data);
    done(null, data);
  });
}

function getLog(req, res, done){
  User.findById(req.query.userId, (err, data) => {
    if (err.name === "CastError"){
      res.send("No such user");
    }
    if (err) return done(err);
    if (data){
      let log = data.log.sort((a, b) => b.date-a.date);
      if (req.query.from){
        log = log.filter(x => x.date >= new Date(req.query.from));
      }
      if (req.query.to){
        log = log.filter(x => x.date <= new Date(req.query.to));
      }
      if (req.query.limit){
        log = log.slice(0, Number(req.query.limit))
      }
      log = log.map(x => {
        return {description: x.description, duration: x.duration, date: x.date.toDateString()};
      });
      res.json({userId: data._id, username: data.username, count: data.count, log: log});
    }
    else{
      res.send("No such user"); 
    }
    done(null, data);
  });
}

module.exports.createUser = createUser;
module.exports.addExercise = addExercise;
module.exports.getUsers = getUsers;
module.exports.getLog = getLog;
