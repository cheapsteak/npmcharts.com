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
  const interval = Number(searchParams.get('interval') || '7');
  const shouldUseLogScale = searchParams.get('log') === 'true';

  if(interval !== 1 && interval !== 7 && interval !== 30) {
    throw new Error('Invalid interval, must be one of "1", "7", or "30"');
  }

  return (
    <Home
      packageNames={packageNames ?? _.shuffle(config.presetComparisons)[0]}
      isMinimalMode={searchParams.get('minimal') === 'true'}
      isUsingPresetComparisons={!packageNames}
      interval={interval}
      shouldUseLogScale={shouldUseLogScale}
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
