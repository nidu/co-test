import React from 'react'
import FlatButton from 'material-ui/FlatButton'
import $ from 'jquery'

export default class PatientForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isRevealed: false,
      email: null,
      contact: null
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.donor != nextProps.donor) {
      this.setState({
        isRevealed: false,
        email: null,
        contact: null
      })
    }
  }

  reveal() {
    $.get(`/donors/${this.props.donor.id}`)
      .done(({emailAddress, contactNumber}) => this.setState({
        isRevealed: true,
        email: emailAddress,
        contact: contactNumber
      }))
  }

  revealBtn() {
    return (
      <a href="#" onClick={e => {
        e.preventDefault()
        this.reveal()
      } }>
        Click to reveal
      </a>
    )
  }

  render() {
    const {donor} = this.props
    const {email, contact} = this.state

    return (
      <table>
        <tbody>
          <tr>
            <td>Blood group</td>
            <td>{donor.bloodGroup}</td>
          </tr>
          <tr>
            <td>Contact number</td>
            <td>{contact || this.revealBtn() }</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>{email || this.revealBtn() }</td>
          </tr>
        </tbody>
      </table>
    )
  }
}

PatientForm.propTypes = {
  donor: React.PropTypes.object
}