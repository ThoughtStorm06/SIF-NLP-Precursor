import React from 'react';
import { AppProvider } from './store/AppContext.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import './styles/styles.css';

export function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
