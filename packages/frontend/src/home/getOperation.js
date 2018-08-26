import _ from 'lodash';
import { format as formatDate, subYears } from 'date-fns';

import processPackagesStats from 'frontend/src/utils/processPackagesStats';
import getPackagesDownloads from 'utils/stats/getPackagesDownloads';
import isPackageName from 'utils/isPackageName';
import fetchReposCommitsStats from 'frontend/src/home/fetchReposCommitStats';

const DATE_FORMAT = 'YYYY-MM-DD';

const getOperation = packageNames => {
  const endDate = formatDate(new Date(), DATE_FORMAT);
  const startDate = formatDate(subYears(new Date(), 1), DATE_FORMAT);

  if (_.every(packageNames, isPackageName)) {
    // packageNames are npm packages
    return getPackagesDownloads(packageNames, {
      startDate,
      endDate,
    }).then(processPackagesStats);
  }

  // packageNames are github repos
  return fetchReposCommitsStats(packageNames);
};

export default getOperation;
