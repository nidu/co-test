import styles from './index.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import FlatButton from 'material-ui/FlatButton'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Map from './components/Map'
import DonorForm from './components/DonorForm'
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
      donors: []
    }
  }

  onMapClick = (evt, view) => {
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
          />
        </MuiThemeProvider>, 
        document.querySelector('.esri-popup-content')
      )

      view.popup.dockEnabled = false
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

  componentDidUpdate(prevProps, prevState) {
    if (this.state.role == 'patient' && this.state.center && (
          prevState.role != this.state.role ||
          !isEqual(prevState.center, this.state.center)
        )) {
      $.get(['/donors', ...this.state.center, this.state.radius].join('/'))
        .done(donors => this.setState({donors}))
    }
  }

  render() {
    return (
      <div>
        <h1>Blood'o'nation</h1>
        <RoleSelect role={this.state.role} onChange={role => this.setState({role})} />
        <div>
          <Map 
            onClick={this.onMapClick} 
            onExtentChange={this.onExtentChange}
            role={this.state.role}
            donors={this.state.role == 'patient' ? this.state.donors : []}
          />
        </div>
        <Footer />
      </div>
    )
  }
}

const Footer = () => (
  <div>Made by Nikolay Durygin as a Crossover evaluation project.</div>
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