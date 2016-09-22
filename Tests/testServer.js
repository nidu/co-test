var request = require('supertest')
var {Donor, app} = require('../Code/server')
var assert = require('assert')
var _ = require('lodash')

var donor = {
  "id": "df919371-b887-44ad-9ee5-a5d67c9818b1",
  "firstName": "Jake",
  "lastName": "Smith",
  "contactNumber": "+79 123 1234 123",
  "emailAddress": "k@g.com",
  "bloodGroup": "B",
  "location": {
    "type": "Point",
    "coordinates": [65.53354517727678, 57.15586140869079]
  }
}

var donor2 = _.assign({}, donor, {
  id: '44356358-4c8a-4bfb-9b02-e20a2422cb01',
  location: {
    "type": "Point",
    "coordinates": [65.53354517727678, 58.15586140869079]
  }
})

describe('Donor', function () {
  it('#post/donors', function(done) {
    request(app)
      .post('/donors')
      .send(donor)
      .expect(200, function(err, resp) {
        assert.equal(resp.body.id, donor.id)
        Donor.findOne({id: donor.id}, (err, d) => {
          assert(!err)
          assert(d)
          assert.equal(d.firstName, donor.firstName)
          assert.deepEqual(d.coordinates, donor.coordinates)
          done()
        })
      })
  })

  it('#get/donors/:id', function(done) {
    request(app)
      .get(`/donors/${donor.id}`)
      .expect(200, function(err, resp) {
        assert(!err)
        assert.equal(resp.body.id, donor.id)
        assert.equal(resp.body.firstName, donor.firstName)
        assert.equal(resp.body.lastName, donor.lastName)
        done()
      })
  })

  it('#put/donors', function(done) {
    request(app)
      .put(`/donors/${donor.id}`)
      .send({
        firstName: donor.lastName,
        lastName: donor.firstName
      })
      .expect(200, function(err, resp) {
        assert(!err)
        assert.equal(resp.body.id, donor.id)
        Donor.findOne({id: donor.id}, (err, d) => {
          assert(!err)
          assert(d)
          assert.equal(d.firstName, donor.lastName)
          assert.equal(d.lastName, donor.firstName)
          done()
        })
      })
  })

  it('donorExist', function(done) {
    Donor.find({id: donor.id}, (err, resp) => {
      assert.equal(resp.length, 1)
      done()
    })
  })

  it('#get/donors', function(done) {
    var [lon, lat] = donor.location.coordinates
    request(app)
      .get(`/donors/${lon}/${lat}/${10000}`)
      .expect(200, function(err, resp) {
        assert(!err)
        assert(resp.body.length > 0)
        done()
      })
  })

  it('#delete/donors/:id', function(done) {
    request(app)
      .delete(`/donors/${donor.id}`)
      .expect(200, function(err, resp) {
        Donor.findOne({id: donor.id}, (err, d) => {
          assert(!d)
          done()
        })
      })
  })
})