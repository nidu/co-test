import React from 'react'
import { render } from 'react-dom'
import App from './app.jsx'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

render(<MuiThemeProvider><App/></MuiThemeProvider>, document.querySelector('#app'))
