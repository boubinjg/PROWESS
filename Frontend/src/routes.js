import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom'

import App from './components/App';
import Delete from './components/Delete';

export default (
    <BrowserRouter path="/" component={App}>
        <Route path="/delete" component={Delete} />
    </BrowserRouter>
);
