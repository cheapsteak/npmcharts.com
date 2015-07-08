'use strict';

import {getCommits, getRepo} from './services/github';
import {render} from './components/repository';

Promise.all([getRepo(), getCommits()])
.then(([repository, commits]) => {
  document.body.innerHTML = render(repository, commits);
});

