import styles from './index.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import FlatButton from 'material-ui/FlatButton'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Map from './components/Map'
import DonorForm from './components/DonorForm'
import PatientForm from './components/PatientForm'
import $ from 'jquery'
import isEqual from 'lodash/isEqual'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      role: 'donor', // or 'patient'
      location: null,
      donors: [],
      donor: null
    }
    
    this.socket = io()
    this.socket.on('donor', (donor) => {
      console.log('Got donor', donor)
      this.setState({
        donors: this.state.donors.filter(d => d.id != donor.id).concat([donor]) 
      })
    })
    this.socket.on('donorDeleted', id => {
      console.log('Donor deleted', id)
      this.setState({
        donors: this.state.donors.filter(d => d.id != id) 
      })
    })
  }

  onMapClick = (evt, view) => {
    this.view = view
    console.log('onMapClick', evt, view.extent)
    if (this.state.role == 'donor') {
      view.popup.open({
        title: 'Become a donor',
        location: evt.mapPoint
      })

      ReactDOM.render(
        <MuiThemeProvider>
          <DonorForm 
            onClose={() => view.popup.close()}
            mapPoint={evt.mapPoint}
            afterSave={donor => this.setState({donor})}
            afterDelete={() => this.setState({donor: null})}
          />
        </MuiThemeProvider>, 
        document.querySelector('.esri-popup-content')
      )

      view.popup.dockEnabled = false
    } else {
      let donor
      view.hitTest(evt.screenPoint).then((response) => {  
        const graphics = response.results
        graphics.forEach(({graphic}) => {
          donor = graphic.attributes
        })
      })

      if (donor) {
        ReactDOM.render(
          <MuiThemeProvider>
            <PatientForm 
              donor={donor}
            />
          </MuiThemeProvider>, 
          document.querySelector('.esri-popup-content')
        )
      }
    }
  }

  onExtentChange = (extent, view) => {
    console.log('onExtentChange', extent)
    const {longitude, latitude} = extent.center
    const {width, height} = extent
    this.setState({
      center: [longitude, latitude],
      radius: Math.max(width, height)
    })
  }

  loadDonor(view) {
    this.view = view
    const id = this.getDonorIdFromUrl()
    if (id) {
      $.get(`/donors/${id}`)
        .done(donor => {
          console.log('loadDonor.done', donor)
          this.setState({
            donor,
            center: donor.location.coordinates
          })
        })
    }
  }

  getDonorIdFromUrl() {
    const m = location.hash.match(/#\/donors\/(.+)/)
    if (m) {
      return m[1]
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.role == 'patient' && this.state.center && (
          prevState.role != this.state.role ||
          !isEqual(prevState.center, this.state.center)
        )) {
      $.get(['/donors', ...this.state.center, this.state.radius].join('/'))
        .done(donors => this.setState({donors}))
    }
    if (this.state.role != prevState.role && this.view) {
      this.view.popup.close()
    }
  }

  render() {
    return (
      <div className={styles.container}>
        <h1><a href="#">Blood'o'nation</a></h1>
        <RoleSelect role={this.state.role} onChange={role => this.setState({role})} />
        {helpPages[this.state.role]}
        <Map 
          onClick={this.onMapClick}
          onExtentChange={this.onExtentChange}
          onInit={view => this.loadDonor(view)}
          role={this.state.role}
          donors={this.state.role == 'patient' ? this.state.donors : [this.state.donor].filter(v => v)}
          center={this.state.center}
        />
        <Footer />
      </div>
    )
  }
}

const helpPages = {
  'donor': 'Click on your location on the map to register yourself as a donor. You\'ll get unique link which you can use to edit or delete info later.',
  'patient': 'Click any donor to get contact information.'
}

const Legend = () => (
  <div className={styles.legend}>
    {[['A', '#2ecc71'], ['B', '#3498db'], ['AB', '#9b59b6'], ['O', '#e67e22']].map(([t, color]) => {
      <div key={t} className={styles.legendCell}>
        <div className={styles.legendCircle} />
        <div>{t}</div>
      </div>
    })
  </div>
)

const Footer = () => (
  <div className={styles.footer}>Made by Nikolay Durygin as a <a href="https://www.crossover.com">Crossover</a> evaluation project.</div>
)

const RoleSelect = ({role, onChange}) => (
  <RadioButtonGroup name="roles" defaultSelected={role} onChange={(evt, value) => onChange(value)}>
    {[{value: 'donor', label: 'Donor'}, {value: 'patient', label: 'Patient'}].map(({value, label}) => (
      <RadioButton
        key={value}
        value={value}
        label={label}
      />
    ))}
  </RadioButtonGroup>
)