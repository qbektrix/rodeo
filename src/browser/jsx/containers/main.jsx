import React from 'react';
import {Provider} from 'react-redux';

import FullScreen from '../components/full-screen/full-screen.jsx';
import StudioLayout from './studio-layout/studio-layout.jsx';
import Sidebar from '../components/sidebar/sidebar.jsx';
import ModalDialogContainer from '../components/modal-dialog/modal-dialog-container.jsx';
import NotificationsContainer from '../components/notifications/notifications-container.jsx';
import rootReducer from './main.reducer';
import initialState from './main.initial';
import ipcDispatcher from '../services/ipc-dispatcher';
import kernelActions from '../actions/kernel';
import dialogActions from '../actions/dialogs';
import applicationControl from '../services/application-control';
import reduxStore from '../services/redux-store';

const store = reduxStore.create(rootReducer, initialState.getState());

ipcDispatcher(store.dispatch);

// find the kernel immediately
store.dispatch(kernelActions.detectKernel());
store.dispatch(dialogActions.showRegisterRodeo());

// no visual for this please
applicationControl.checkForUpdates();

/**
 * Expose the global application state/store in two ways:
 * a) connect() from 'react-redux' (i.e. containers)
 * b) this.context.store for components that explictly ask for it (i.e., SplitPane component to broadcast)
 *
 * @class Main
 * @extends ReactComponent
 */
export default React.createClass({
  displayName: 'Main',
  childContextTypes: {
    store: React.PropTypes.object
  },
  getChildContext: function () {
    return {store};
  },
  render: function () {
    return (
      <Provider store={store}>
        <FullScreen row>
          <StudioLayout />
          <Sidebar />
          <ModalDialogContainer />
          <NotificationsContainer />
        </FullScreen>
      </Provider>
    );
  }
});
