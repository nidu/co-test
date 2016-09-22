import React from 'react'
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import set from 'lodash/fp/set'
import assign from 'lodash/assign'
import isEmpty from 'lodash/isEmpty'
import $ from 'jquery'
import styles from './DonorForm.scss'

// taken from http://www.redcrossblood.org/learn-about-blood/blood-types
const allBloodGroups = ['A', 'B', 'AB', 'O']

export default class DonorForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: {
        id: null,
        firstName: '',
        lastName: '',
        contactNumber: '',
        emailAddress: '',
        bloodGroup: 'A'
      },
      errors: {},
      error: null,
      step: 'editing', // 'editing' | 'saving' | 'saved'
      id: null
    }
  }

  componentDidMount() {
    const id = this.getDonorIdFromUrl()
    if (id) {
      $.get(`/donors/${id}`)
        .done(data => {
          this.props.onLoadDonor && this.props.onLoadDonor(data)
          this.setState({ data })
        })
    }
  }

  getDonorIdFromUrl() {
    const m = location.hash.match(/#\/donors\/(.+)/)
    if (m) {
      return m[1]
    }
  }

  validate(data) {
    const errors = {}
    const validateField = (name, isValid, error) => {
      if (!isValid(data[name])) {
        errors[name] = error
      }
    }

    validateField('firstName', v => v.length >= 2, 'Too short. Enter not less than 2 characters.')
    validateField('lastName', v => v.length >= 2, 'Too short. Enter not less than 2 characters.')
    validateField(
      'contactNumber',
      v => v.match(/^(\+|00)\d{2} \d{3} \d{4} \d{3}$/),
      'Should be in format (+xx xxx xxxx xxx | 00xx xxx xxxx xxx).'
    )
    validateField(
      'emailAddress',
      v => v.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/),
      'Invalid email.'
    )

    return errors
  }

  onSave() {
    const {longitude, latitude} = this.props.mapPoint

    const data = assign({}, this.state.data, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    })
    for (const key in data) {
      if (data[key] && data[key].trim) {
        data[key] = data[key].trim()
      }
    }
    console.log('onSave', data, this.props)

    const errors = this.validate(data)
    if (isEmpty(errors)) {
      $.ajax({
        method: data.id ? 'put' : 'post',
        url: data.id ? `/donors/${data.id}` : '/donors',
        data
      }).done(v => this.onSaveDone(v))
        .fail(e => this.setState({
          step: 'editing',
          error: e.message
        }))
      this.setState({
        step: 'saving',
        errors: {},
        error: null
      })
    } else {
      this.setState({
        errors: errors,
        error: null
      })
    }
  }

  onSaveDone(donor) {
    this.setState({
      step: 'editing',
      data: donor
    })
    this.props.afterSave && this.props.afterSave(donor)
    location.hash = `/donors/${donor.id}`
  }

  onDeleteInfo() {
    const {data} = this.state
    $.ajax({
      method: 'delete',
      url: `/donors/${data.id}`
    }).done(() => {
      this.setState({
        data: set('id', null, this.state.data),
        step: 'editing'
      })
      this.props.afterDelete && this.props.afterDelete()
    })

    this.setState({
      step: 'deleting'
    })
    location.hash = ''
  }

  updateData(attr, value) {
    const {data} = this.state
    this.setState({
      data: set(attr, value, data)
    })
  }

  href() {
    return `${location.origin}/#/donors/${this.state.data.id}`
  }

  render() {
    const {data, errors, step} = this.state
    const disabled = step == 'saving' || step == 'deleting'
    const onTextFieldChange = name => e => this.updateData(name, e.target.value)
    const onSelectFieldChange = name => (e, idx, value) => this.updateData(name, value)

    return (
      <div className={styles.donorForm}>
        <TextField
          id="firstName"
          value={data.firstName}
          onChange={onTextFieldChange('firstName') }
          errorText={errors.firstName}
          hintText="First name"
          disabled={disabled}
          />
        <TextField
          id="lastName"
          value={data.lastName}
          onChange={onTextFieldChange('lastName') }
          errorText={errors.lastName}
          hintText="Last name"
          disabled={disabled}
          />
        <TextField
          id="contactNumber"
          value={data.contactNumber}
          onChange={onTextFieldChange('contactNumber') }
          errorText={errors.contactNumber}
          hintText="Contact number"
          disabled={disabled}
          />
        <TextField
          id="email"
          type="email"
          value={data.emailAddress}
          onChange={onTextFieldChange('emailAddress') }
          errorText={errors.emailAddress}
          hintText="Email address"
          disabled={disabled}
          />
        <SelectField
          id="bloodGroup"
          value={data.bloodGroup}
          onChange={onSelectFieldChange('bloodGroup') }
          hintText="Blood group"
          disabled={disabled}>
          {allBloodGroups.map(g => (
            <MenuItem key={g} value={g} primaryText={g} />
          )) }
        </SelectField>
        <div>
          <FlatButton
            label={step == 'saving' ? 'Saving...' : 'Save'}
            primary={true}
            disabled={disabled}
            onClick={e => this.onSave() }
            />
          {/*<FlatButton
            label="Close"
            secondary={true}
            disabled={disabled}
            onClick={e => this.props.onClose()}
          />*/}
        </div>
        {this.state.error}
        {this.state.data.id &&
          <div>
            Link to your form: {this.href() }
            <IconButton
              tooltip="Delete info"
              onClick={e => this.onDeleteInfo() }
              iconClassName="material-icons"
              tooltipPosition="top-center"
              >
              delete
            </IconButton>
          </div>}
      </div>
    )
  }
}

DonorForm.propTypes = {
  onClose: React.PropTypes.func,
  mapPoint: React.PropTypes.object
}