import { BrowserRouter, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import _ from 'lodash';
import config from 'configs';

import { Home } from './home/home';
import './style.styl';

const root = createRoot(document.getElementById('root'));

const App = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const packageNames = params['*'] ? params['*'].split(',') : null;

  return (
    <Home
      packageNames={packageNames ?? _.shuffle(config.presetComparisons)[0]}
      isMinimalMode={searchParams.get('minimal') === 'true'}
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
