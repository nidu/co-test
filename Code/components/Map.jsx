import React from 'react'
import styles from './Map.scss'
import isEqual from 'lodash/isEqual'

const bloodGroupMap = {
  A: 1,
  B: 2,
  AB: 3,
  O: 4
}

export default class MapComponent extends React.Component {
  view

  constructor(props) {
    super(props)
    this.state = {
      isLoaded: false
    }
  }

  initView() {
    this.view = {}
  }

  isGeolocationSupported() {
    return navigator && navigator.geolocation && navigator.geolocation.getCurrentPosition
  }

  requestPos() {
    if (this.props.shouldRequestPos && this.isGeolocationSupported()) {
      navigator.geolocation.getCurrentPosition(pos => this.setPos({
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude
      }))
    }
  }

  setPos(pos) {
    this.savePos(pos)
    this.view.center = [pos.longitude, pos.latitude]
  }

  savePos(pos) {
    if (localStorage) {
      localStorage.setItem('lastPos', JSON.stringify(pos))
    }
  }

  loadPos() {
    if (localStorage) {
      const posStr = localStorage.getItem('lastPos')
      if (posStr) try {
        const pos = JSON.parse(posStr)
        const {longitude, latitude} = pos
        if (longitude && latitude) {
          return pos
        }
      } catch(err) {
        console.error("Couldn't load pos from local storage:", err)
      }
    }
  }

  componentDidUpdate(prevProps) {
    console.log('componentDidUpdate', this.props.donors)
    if (this.props.donors != prevProps.donors && this.layer && this.makePoint) {
      this.createLayer(this.donorsToGraphics(this.props.donors))
    }
    if (this.props.center && !isEqual(this.props.center, prevProps.center)) {
      this.view.center = this.props.center
    }
  }

  donorsToGraphics(donors) {
    return this.props.donors.map(d => ({
      geometry: this.makePoint(d.location.coordinates[0], d.location.coordinates[1]),
      attributes: {
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        bloodGroup: d.bloodGroup,
        bloodGroupNum: bloodGroupMap[d.bloodGroup]
      }
    }))
  }

  componentDidMount() {
    window.require([
      'esri/Map',
      'esri/views/MapView',
      'esri/widgets/Search',
      'esri/tasks/Locator',
      'esri/core/watchUtils',
      'esri/layers/FeatureLayer',
      'esri/geometry/Point',
      'esri/renderers/SimpleRenderer',
      'esri/symbols/SimpleMarkerSymbol',
      'dojo/domReady!'
    ], (Map, MapView, Search, Locator, watchUtils, FeatureLayer, Point, SimpleRenderer, SimpleMarkerSymbol) => {
      const pos = this.loadPos()
      const map = new Map({
        basemap: 'streets'
      })
      const view = new MapView({
        container: 'map-component',
        zoom: 15,
        center: pos ? [pos.longitude, pos.latitude] : undefined,
        map
      })

      view.on('click', (evt, a, b, c) => {
        console.log('click', evt, a, b, c)
        this.props.onClick(evt, view)
      })

      // Search widget
      const searchWidget = new Search({
        view: view,
        popupEnabled: false
      })
      searchWidget.startup()

      view.ui.add(searchWidget, {
        position: "top-left",
        index: 0
      })

      view.popup.dockEnabled = false

      // Locator
      this.locatorTask = new Locator({
        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
      })

      // Watch extent
      watchUtils.whenTrue(view, 'stationary', () => {
        if (view.extent) {
          this.props.onExtentChange(view.extent, view)
        }
      })

      // Feature layer
      this.createLayer = (data) => {

        const layer = new FeatureLayer({
          // source: [{"geometry":new Point(65.56023164760627, 57.16280919216879),"attributes":{"id":"5f50d6df-da5c-4830-9b9b-3d6dcc492df6","firstName":"Nikolay","lastName":"Durygin"}}],
          source: data,
          fields: [{
            name: 'id',
            alias: 'id',
            type: 'oid'
          }, {
            name: 'bloodGroup',
            alias: 'bloodGroup',
            type: 'string'
          }],
          objectIdField: 'id',
          geometryType: 'point',
          spatialReference: {wkid: 3857},

          popupTemplate: {
            title: '{firstName} {lastName}',
            dockEnabled: false,
            // content: `
            //   <p>Blood group: {bloodGroup}
            //   <p>Contact number: <a href="#" id="contact-revealer">Click to reveal</a>
            //   <p>Email address: <a href="#" id="email-revealer">Click to reveal</a>
            // `
          },
          renderer: new SimpleRenderer({
            symbol: new SimpleMarkerSymbol({
              style: 'circle',
              size: 15,
              outline: {
                width: 0,
                color: 'gray',
                style: 'solid'
              }
            }),
            visualVariables: [{
              type: 'color',
              field: 'bloodGroupNum',
              stops: [{
                value: 1,
                color: '#2ecc71'
              }, {
                value: 2,
                color: '#3498db'
              }, {
                value: 3,
                color: '#9b59b6'
              }, {
                value: 4,
                color: '#e67e22'
              }]
            }]
          })
        })

        // layer.on('click', evt => this.props.onClick(evt, view))
        
        if (this.layer) {
          map.remove(this.layer)
        }
        this.layer = layer
        map.add(layer)
      }

      view.then(() => {
        this.props.onExtentChange(view.extent, view)
        this.props.onInit && this.props.onInit(view)
      })

      this.makePoint = (x, y) => new Point(x, y)
      this.view = view
      this.requestPos()
      this.createLayer(this.donorsToGraphics(this.props.donors))
      this.forceUpdate()
    })
  }

  render() {
    return (
      <div className={styles.mapComponent + ' ' + styles[this.props.role]}>
        <div id="map-component" />
      </div>
    )
  }
}