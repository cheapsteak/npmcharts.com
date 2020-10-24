import _ from 'lodash';
import { setDay } from 'date-fns';

export async function fetchRepoStats(orgRepo) {
  const url = `https://api.github.com/repos/${orgRepo}/stats/commit_activity`;
  const response = await fetch(url);
  if (response.ok) {
    const data = response.json();
    _.flow(
      dataChunkedByWeek =>
        dataChunkedByWeek.map(week =>
          week.days.map((commits, i) => ({
            count: commits,
            day: setDay(week.week * 1000, i),
          })),
        ),
      _.flatMap,
    )(data);
  }
}

export const fetchReposStats = orgRepos =>
  Promise.all(
    orgRepos.map(async orgRepo => ({
      downloads: () => fetchRepoStats(orgRepo),
      name: orgRepo,
    })),
  );

export default fetchReposStats;
