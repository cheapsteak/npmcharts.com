import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import _ from 'lodash';
import Vue from 'vue';
import { format as formatDate } from 'date-fns';
import config from 'configs';

import { Home } from './home/home';
import './style.styl';
// import Home from './home/home.vue';

Vue.filter('formatDate', function(date, format) {
  return formatDate(date, format);
});

const root = createRoot(document.getElementById('root'));

const App = () => {
  const params = useParams();
  const packageNames = params['*'] ? params['*'].split(',') : null;

  return (
    <Home
      packageNames={packageNames ?? _.shuffle(config.presetComparisons)[0]}
      isMinimalMode={false}
      isUsingPresetComparisons={!packageNames}
    />
  );
};

const RoutedApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/compare/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);

root.render(<RoutedApp />);