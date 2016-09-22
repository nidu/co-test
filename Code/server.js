var express = require('express')
var app = express()
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var uuid = require('node-uuid')
var http = require('http').Server(app)
var io = require('socket.io')(http)
var _ = require('lodash')
var debug = require('debug')('app')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('views', './Code/views')
app.set('view engine', 'ejs')
app.use(express.static('public'))

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/co-test')

var DonorSchema = new mongoose.Schema({
  id: {type: String, index: true},
  firstName: String,
  lastName: String,
  contactNumber: String,
  emailAddress: String,
  bloodGroup: String,
  location: {
    type: {type: String},
    coordinates: [Number]
  }
})
DonorSchema.index({location: '2dsphere'})
var Donor = mongoose.model('Donor', DonorSchema)

io.on('connection', function (socket) {
  console.log('user connected')
})

app.get('/', function (req, res) {
  res.render('template')
})

app.get('/donors/:lon/:lat/:dist', function (req, res) {
  var {lon, lat, dist} = req.params
  Donor.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        $maxDistance: dist
      }
    }
  }).select({id: 1, firstName: 1, lastName: 1, bloodGroup: 1, location: 1})
    .exec((err, donors) => {
      if (err) {
        console.error('/donors', err)
        res.status(500)
      }
      res.send(donors)
    })
})

app.get('/donors/:id', function (req, res) {
  Donor.findOne({id: req.params.id}, (err, donor) => {
    if (err) {
      console.error('/donors/:id', err)
      res.status(500)
    } else if (!donor) {
      res.status(404)
    }
    res.send(donor)
  })
})

app.put('/donors/:id', function (req, res) {
  var id = req.params.id
  var data = _.omit(req.body, ['id', '_id'])
  Donor.findOneAndUpdate({id: id}, data, {new: true}, (err, donor) => {
    if (!donor) {
      res.status(404)
    } if (err) {
      res.status(500)
    } else {
      io.emit('donor', donor, {for: 'everyone'})
      res.send(donor)
    }
  })
})

app.post('/donors', function (req, res) {
  var id = req.body.id || uuid()
  var donorData = _.assign({}, req.body, {id: id})
  var donor = new Donor(donorData)
  donor.save(err => {
    if (err) {
      console.error('/donors', err)
      res.status(500)
    } else {
      res.send(donor)
      io.emit('donor', donor, {for: 'everyone'})
    }
  })
})

app.delete('/donors/:id', function (req, res) {
  debug('/donors/:id', req.params.id)
  Donor.remove({id: req.params.id}, (err, resp) => {
    if (err) {
      res.status(500)
      console.error('/donors/:id', err)
    } else if (resp.result.n == 0) {
      res.status(404)
    }
    res.send()
    io.emit('donorDeleted', req.params.id, {for: 'everyone'})
  })
})

var port = process.env.PORT || 3000
http.listen(port, function () {
  console.log(`co-test app listening on port ${port}!`)
})

module.exports = {
  app: http,
  Donor: Donor
}