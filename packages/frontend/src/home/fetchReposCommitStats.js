import _ from 'lodash';
import { setDay } from 'date-fns';

export const fetchRepoStats = orgRepo => {
  const url = `https://api.github.com/repos/${orgRepo}/stats/commit_activity`;
  return fetch(url)
    .then(response => response.json())
    .then(data =>
      _.flow(
        dataChunkedByWeek =>
          dataChunkedByWeek.map(week =>
            week.days.map((commits, i) => ({
              count: commits,
              day: setDay(week.week * 1000, i),
            })),
          ),
        _.flatMap,
      )(data),
    );
};

export const fetchReposStats = orgRepos =>
  Promise.all(
    orgRepos.map(async orgRepo => ({
      downloads: await fetchRepoStats(orgRepo),
      name: orgRepo,
    })),
  );

export default fetchReposStats;
