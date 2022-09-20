import React from 'react'
import { Switch, Route } from 'react-router-dom'
import App from './App'
import Delete from './Delete'

const Main = () => (
    <main>
        <Switch>
            <Route exact path='/' component={App}/>
            <Route path='/delete' component={Delete}/>
        </Switch>
    </main>
)

export default Main
