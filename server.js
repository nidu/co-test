var express = require('express')
var app = express()
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var uuid = require('node-uuid')
var _ = require('lodash')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', './src/views')
app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost/co-test')

var DonorSchema = new mongoose.Schema({
  id: String,
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

app.get('/', function (req, res) {
  res.render('template')
})

app.get('/donors/:lon/:lat/:dist', function (req, res) {
  var {lon, lat, dist} = req.params
  // var {xmin, xmax, ymin, ymax} = req.params
  // var geometry = {
  //   type: 'Polygon',
  //   coordinates: [
  //     [xmin, ymin],
  //     [xmax, ymin],
  //     [xmax, ymax],
  //     [xmin, ymax],
  //     [xmin, ymin]
  //   ]
  // }
  Donor.find({
    // location: {
    //   $geoWithin: {
    //     $geometry: geometry 
    //   }
    // }
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        $maxDistance: dist
      }
    }
  }, (err, donors) => {
    if (err) {
      console.error('/donors', err)
      res.status(500)
    }
    res.send(donors)
  })
})

app.get('/donors/:id', function (req, res) {
  Donor.findOne({id: req.params.id}, (err, donor) => {
    if (!donor) {
      res.status(404)
    }
    res.send(donor)
  })
})

app.put('/donors/:id', function (req, res) {
  var id = req.params.id
  var data = _.omit(req.body, ['id', '_id'])
  Donor.update({id: id}, data, (err, donor) => {
    res.send(req.body)
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
    }
    res.send(donor)
  })
})

app.delete('/donors/:id', function (req, res) {
  Donor.remove({id: req.params.id}, (err, resp) => {
    res.send(resp)
  })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})