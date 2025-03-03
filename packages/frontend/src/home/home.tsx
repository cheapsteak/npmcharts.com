import { useState, useEffect, Fragment, useRef } from 'react';
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { processPackagesStats } from 'utils/processPackagesStats';
import { format as formatDate, subDays, isWithinRange } from 'date-fns';

import * as queryString from 'querystring';

import { Graph } from '../graph/Graph';
import { getPackagesDownloadsOverPeriod } from 'utils/getPackagesDownloadsOverPeriod';

import fileSaver from 'file-saver';
import { fetchBundleSize } from 'frontend/src/home/fetchBundlesSizes';
import { downloadCsv } from './downloadCsv';
import { domNodeToSvg, domNodeToPng } from '../utils/dom-to-image';
import _ from 'lodash';
import config from 'configs';
import contributors from './contributors.json';

import './home.styl';
import './home.minimal.styl';

const presetComparisons = _.shuffle(config.presetComparisons);

function track(eventName, value = undefined) {
  // @ts-ignore
  if (typeof ga === 'undefined') return;
  // @ts-ignore
  ga('send', 'event', eventName, value);
}

let contributorCounter = 0;
const shuffledContributorsList = _.shuffle(contributors);
/**
 * Get a contributor from the list, randomly
 */
function getContributorRandom() {
  return shuffledContributorsList[
    contributorCounter++ % shuffledContributorsList.length
  ];
}

const getPackagesMetaDataByNames = async (
  packageNames,
  startDaysOffset,
  endDaysOffset,
) => {
  const startDate = subDays(Date.now(), startDaysOffset);
  const endDate = subDays(Date.now(), endDaysOffset);
  const packageReleaseResponses = await Promise.all(
    packageNames.map(packageName =>
      fetch(`/api/npm-metadata?packageName=${encodeURIComponent(packageName)}`)
        .then(response => response.json())
        .then(metadata => {
          const releaseDates = _.invertBy(
            _.omitBy(
              metadata.releaseDatesByVersion,
              (datePublished, versionName) => {
                if (['created', 'modified'].includes(versionName)) return true;
                if (!isWithinRange(datePublished, startDate, endDate))
                  return true;
              },
            ),
            datePublished =>
              formatDate(datePublished, 'YYYY-MM-DD', null, 'UTC'),
          );
          return [
            packageName,
            {
              releaseDates,
              hasTypings: metadata.hasTypings,
              definitivelyTyped: metadata.definitivelyTyped,
            },
          ];
        }),
    ),
  );
  return Object.fromEntries(packageReleaseResponses);
};

export const Home = ({
  isMinimalMode,
  packageNames,
  isUsingPresetComparisons,
  interval,
  shouldUseLogScale,
}: {
  isMinimalMode: boolean;
  packageNames: Array<string> | undefined;
  isUsingPresetComparisons: boolean;
  interval: 1 | 7 | 30;
  shouldUseLogScale: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEmbedded = isMinimalMode;

  const packageInputRef = useRef(null);
  const graphWrapperElementRef = useRef<HTMLDivElement>(null);
  const [packageInputValue, setPackageInputValue] = useState('');

  const [npmMetadataByPackageName, setNpmMetadataByPackageName] = useState<
    Record<
      string,
      {
        releaseDates: Record<string, Array<string>>;
        definitivelyTyped: boolean;
        hasTypings: boolean;
      }
    >
  >(null);
  const [isLoadingDownloadStats, setIsLoadingDownloadStats] = useState(false);
  const [isLoadingNpmMetaData, setIsLoadingNpmMetaData] = useState(false);
  const [
    packagesBundleSizesResponse,
    setPackagesBundleSizesResponse,
  ] = useState<
    Record<
      string,
      {
        gzip: string;
        size: string;
      }
    >
  >({});
  const [showWeekends, setShowWeekends] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const [
    packagesDownloadStatsResponse,
    setPackagesDownloadStatsResponse,
  ] = useState<
    Array<{
      downloads: Record<string, Array<number>>;
      start: string;
      end: string;
      package: string;
    }>
  >(null);

  useEffect(() => {
    setIsLoadingDownloadStats(true);

    // @ts-ignore
    setTimeout(() => ga('send', 'pageview'));

    getPackagesDownloadsOverPeriod({
      packageNames,
      startDaysOffset: searchParams.get('start') ? searchParams.get('start') : 365,
      endDaysOffset: searchParams.get('end') ? searchParams.get('end') : 0,
    }).then(packagesDownloadStatsResponse => {
      console.log({packagesDownloadStatsResponse});
      setPackagesDownloadStatsResponse(
        'package' in packagesDownloadStatsResponse
          ? [packagesDownloadStatsResponse]
          : Object.values(packagesDownloadStatsResponse),
      );
      setIsLoadingDownloadStats(false);
    });

    setIsLoadingNpmMetaData(true);
    getPackagesMetaDataByNames(
      packageNames,
      searchParams.get('start') ? searchParams.get('start') : 365,
      searchParams.get('end') ? searchParams.get('end') : 0,
    ).then(response => {
      setNpmMetadataByPackageName(response);
      setIsLoadingNpmMetaData(false);
    });

    Promise.all(
      packageNames.map(async packageName => ({
        [packageName]: await fetchBundleSize(packageName),
      })),
    ).then(bundleSizesResponses => {
      setPackagesBundleSizesResponse(
        bundleSizesResponses.reduce((acc, x) => ({ ...acc, ...x })),
      );
    });
  }, [packageNames]);

  function addPackage(packageName) {
    // @ts-ignore
    ga(
      'send',
      'event',
      'packageInput',
      'add',
      `${packageName} existing:${packageNames}`,
    );

    navigate({
      pathname: `/compare/${
        isUsingPresetComparisons
          ? packageName
          : _.uniq(packageNames.concat(packageName)).join(',')
      }`,
      search: searchParams.toString(),
    });
  }

  function removePackage(packageName) {
    // @ts-ignore
    ga(
      'send',
      'event',
      'packageInput',
      'remove',
      `${packageName} existing:${packageNames}`,
    );

    navigate({
      pathname: `/compare/${_.without(packageNames, packageName).join(',')}`,
      search: searchParams.toString(),
    });
  }

  const getMergedQueryParams = params => {
    const merged = { ...Object.fromEntries(searchParams), ...params };
    delete merged.periodLength;
    return queryString.stringify(merged);
  };

  const shareUrl = `https://npmcharts.com/compare/${packageNames.join(',')}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${window.encodeURIComponent(
    shareUrl,
  )}`;

  const packageDownloadStats = !packagesDownloadStatsResponse
    ? null
    : processPackagesStats(
        packagesDownloadStatsResponse,
        npmMetadataByPackageName,
      );

  const [contributorInfo, setContributorInfo] = useState(
    getContributorRandom(),
  );

  function handleClickContributor() {
    this.contributorInfo = getContributorRandom();
    this.track('click contributor');
  }

  function handleDownloadRequest(e) {
    const packageNames = packageDownloadStats.map(x => x.name);
    switch (e.target.value) {
      case 'png':
        setExportStatus('exporting png');
        setTimeout(() => {
          domNodeToPng(graphWrapperElementRef.current).then(dataUrl => {
            fileSaver.saveAs(dataUrl, `${packageNames}.png`);
            setExportStatus(null);
          });
        });
        break;
      case 'svg':
        setExportStatus('exporting svg');
        setTimeout(() => {
          domNodeToSvg(graphWrapperElementRef.current).then(dataUrl => {
            fileSaver.saveAs(dataUrl, `${packageNames}.svg`);
            setExportStatus(null);
          });
        });
        break;
      case 'csv':
        setExportStatus('exporting csv');
        setTimeout(() => {
          const moduleWithLongestHistory = _.maxBy(
            packageDownloadStats,
            x => x.entries.length,
          );
          var csv = [['Date', ...packageNames]]
            .concat(
              moduleWithLongestHistory.entries.map(({ day }) => {
                return [day.toLocaleDateString()].concat(
                  packageDownloadStats
                    .map(
                      stats =>
                        stats.entries.find(
                          x => x.day.toISOString() === day.toISOString(),
                        ).count || '',
                    )
                    .join(','),
                );
              }),
            )
            .join('\n');
          track('download csv', packageNames);
          downloadCsv(csv, `${packageNames}.csv`);
          setExportStatus(null);
        });
        break;
      default:
      case '':
        setExportStatus(null);
        return;
    }
    e.target.value = '';
  }

  return (
    <div
      id="home"
      className={
        'opaque-once-stylesheet-loads' + (isMinimalMode ? ' minimal' : '')
      }
      style={{
        opacity: 0,
        // @ts-ignore
        '--typescript-blue': '#3178c6b4',
      }}
    >
      <header
        className={'page-header' + (isLoadingDownloadStats ? ' loading' : '')}
      >
        <h1 className="heading">
          <NavLink to="/" className="identity" title="npmcharts">
            <img src="/images/logo.svg" width="190" alt="npmcharts" />
          </NavLink>

          <p className="sub-heading">
            {isLoadingNpmMetaData ? (
              'fetching package release dates..'
            ) : packageNames.length === 1 ? (
              ''
            ) : (
              <>
                compare{' '}
                {packageNames.map(moduleName => (
                  <span className="package-entry" key={moduleName}>
                    <a
                      className="package-name"
                      title={
                        'Visit https://www.npmjs.com/package/' + moduleName
                      }
                      href={'https://www.npmjs.com/package/' + moduleName}
                      target="_blank"
                    >
                      {moduleName}
                    </a>
                    {npmMetadataByPackageName?.[moduleName]?.hasTypings ? (
                      <svg
                        style={{
                          marginLeft: '3px',
                          width: '13px',
                          height: 'auto',
                        }}
                        fill="none"
                        width="12"
                        height="12"
                        viewBox="0 0 27 26"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="var(--typescript-blue)"
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="m.98608 0h24.32332c.5446 0 .9861.436522.9861.975v24.05c0 .5385-.4415.975-.9861.975h-24.32332c-.544597 0-.98608-.4365-.98608-.975v-24.05c0-.538478.441483-.975.98608-.975zm13.63142 13.8324v-2.1324h-9.35841v2.1324h3.34111v9.4946h2.6598v-9.4946zm1.0604 9.2439c.4289.2162.9362.3784 1.5218.4865.5857.1081 1.2029.1622 1.8518.1622.6324 0 1.2331-.0595 1.8023-.1784.5691-.1189 1.0681-.3149 1.497-.5879s.7685-.6297 1.0187-1.0703.3753-.9852.3753-1.6339c0-.4703-.0715-.8824-.2145-1.2365-.1429-.3541-.3491-.669-.6186-.9447-.2694-.2757-.5925-.523-.9692-.7419s-.8014-.4257-1.2743-.6203c-.3465-.1406-.6572-.2771-.9321-.4095-.275-.1324-.5087-.2676-.7011-.4054-.1925-.1379-.3409-.2838-.4454-.4379-.1045-.154-.1567-.3284-.1567-.523 0-.1784.0467-.3392.1402-.4824.0935-.1433.2254-.2663.3959-.369s.3794-.1824.6269-.2392c.2474-.0567.5224-.0851.8248-.0851.22 0 .4523.0162.697.0486.2447.0325.4908.0825.7382.15.2475.0676.4881.1527.7218.2555.2337.1027.4495.2216.6475.3567v-2.4244c-.4015-.1514-.84-.2636-1.3157-.3365-.4756-.073-1.0214-.1095-1.6373-.1095-.6268 0-1.2207.0662-1.7816.1987-.5609.1324-1.0544.3392-1.4806.6203s-.763.6392-1.0104 1.0743c-.2475.4352-.3712.9555-.3712 1.5609 0 .7731.2268 1.4326.6805 1.9785.4537.546 1.1424 1.0082 2.0662 1.3866.363.146.7011.2892 1.0146.4298.3134.1405.5842.2865.8124.4378.2282.1514.4083.3162.5403.4946s.198.3811.198.6082c0 .1676-.0413.323-.1238.4662-.0825.1433-.2076.2676-.3753.373s-.3766.1879-.6268.2473c-.2502.0595-.5431.0892-.8785.0892-.5719 0-1.1383-.0986-1.6992-.2959-.5608-.1973-1.0805-.4933-1.5589-.8879z"
                        />
                      </svg>
                    ) : npmMetadataByPackageName?.[moduleName]
                        ?.definitivelyTyped ? (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={
                          'https://www.npmjs.com/package/@types/' + moduleName
                        }
                        title="@types/react-google-recaptcha provides TypeScript declarations for this package"
                        style={{
                          marginLeft: '3px',
                          paddingLeft: '1px',
                          fontSize: '8px',
                          fontWeight: 600,
                          height: '11px',
                          width: '11px',
                          border: '1px solid var(--typescript-blue)',
                          color: 'var(--typescript-blue)',
                          display: 'inline-block',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            transform: 'translateY(3px)',
                          }}
                        >
                          DT
                        </span>
                      </a>
                    ) : null}
                    {packagesBundleSizesResponse?.[moduleName] ? (
                      <a
                        className="package-size"
                        title="Inspect bundlesize on bundlephobia"
                        href={`https://bundlephobia.com/result?p=${moduleName}`}
                        target="_blank"
                        style={{ marginLeft: '2px' }}
                      >
                        ({packagesBundleSizesResponse[moduleName]['gzip']}{' '}
                        gzipped)
                      </a>
                    ) : null}
                  </span>
                ))}
              </>
            )}
          </p>
        </h1>
        <div className="header-controls-wrapper">
          <form
            className="package-input"
            onSubmit={e => {
              e.preventDefault();
              e.stopPropagation();
              if (packageInputValue.trim() === '') return;
              addPackage(packageInputValue);
              setPackageInputValue('');
              packageInputRef.current.focus();
            }}
          >
            <input
              ref={packageInputRef}
              className="package-input"
              placeholder="enter a package name"
              aria-label="package name"
              spellCheck={false}
              autoFocus
              value={packageInputValue}
              onChange={e => {
                setPackageInputValue(e.currentTarget.value);
              }}
            />
            <button
              className="add-package-btn"
              disabled={packageInputValue.trim() === ''}
            >
              {packageNames.length > 0 && isUsingPresetComparisons
                ? 'set'
                : 'add'}
            </button>
          </form>
          <div className="graph-config">
            {packageNames && (
              <>
                <label onClick={() => track('set interval', 1)}>
                  <input
                    type="radio"
                    name="interval"
                    checked={interval === 1}
                    value="1"
                    onChange={e => {
                      navigate({
                        search: getMergedQueryParams({ interval: '1' }),
                      });
                    }}
                  />{' '}
                  daily
                </label>
                <label onClick={() => track('set interval', 7)}>
                  <input
                    type="radio"
                    name="interval"
                    checked={interval === 7}
                    value="7"
                    onChange={e => {
                      navigate({
                        search: getMergedQueryParams({ interval: '7' }),
                      });
                    }}
                  />{' '}
                  weekly
                </label>
                <label onClick={() => track('set interval', 30)}>
                  <input
                    type="radio"
                    name="interval"
                    checked={interval === 30}
                    value="30"
                    onChange={e => {
                      navigate({
                        search: getMergedQueryParams({ interval: '30' }),
                      });
                    }}
                  />{' '}
                  monthly
                </label>
              </>
            )}
            <label
              onClick={() => track('set scale', !shouldUseLogScale)}
              style={{ marginLeft: '2em' }}
            >
              <input
                type="checkbox"
                checked={shouldUseLogScale}
                onChange={e => {
                  navigate({
                    search: getMergedQueryParams({ log: !shouldUseLogScale }),
                  });
                }}
              />{' '}
              log scale
            </label>

            <select
              aria-label="export chart as csv, svg, or png"
              onChange={handleDownloadRequest}
              style={{
                marginLeft: 'auto',
                minWidth: '8em',
                textAlign: 'right',
              }}
              defaultValue=""
            >
              <option disabled value="">
                {exportStatus ? exportStatus : 'export as ...'}
              </option>
              <option value="csv">csv</option>
              <option value="svg">svg</option>
              <option value="png">png</option>
            </select>
            <NavLink
              className="minimal-mode"
              style={{ marginLeft: '1em' }}
              to={{
                search: `?minimal=true`,
              }}
              onClick={() => track('enter-minimal-mode')}
            >
              enter minimal mode
            </NavLink>
          </div>
        </div>
      </header>
      <main className={isLoadingDownloadStats ? 'loading' : ''}>
        <div className="chart-container">
          <div className="sample-matches">
            <a
              className="tweet-this-chart"
              href={twitterShareUrl}
              target="_blank"
              onMouseEnter={() => {
                // @ts-ignore
                window.ga(
                  'send',
                  'event',
                  'hoverShare',
                  'twitter',
                  twitterShareUrl,
                );
              }}
              onClick={() => {
                // @ts-ignore
                window.ga('send', 'event', 'share', 'twitter', twitterShareUrl);
              }}
              style={{
                color: '#1da1f2',
                fontSize: '11px',
                fontWeight: 500,
                display: 'inline-block',
                padding: '4px 8px',
                marginLeft: '-4px',
              }}
            >
              <i
                dangerouslySetInnerHTML={{
                  __html: require('../assets/images/icon-twitter.svg'),
                }}
                aria-label="tweet"
                style={{
                  width: '12px',
                  height: 'auto',
                  display: 'inline-block',
                }}
              />{' '}
              this chart{' '}
            </a>{' '}
            <div className="caption">or check out</div>{' '}
            {presetComparisons.map(packages => (
              <NavLink
                to={`/compare/${packages.join(',')}?${searchParams.toString()}`}
                onClick={() => track('click-preset', packages.join(','))}
                className="match"
                key={packages.join(',')}
              >
                {packages.map((packageItem, index) => (
                  <Fragment key={packageItem}>
                    {index !== 0 && (
                      <span className="vs" key={packageItem + 'vs'}>
                        ,{' '}
                      </span>
                    )}
                    <span
                      className="package-name"
                      style={{
                        color:
                          packageNames && packageNames.indexOf(packageItem) > -1
                            ? config.palette[
                                packageNames.indexOf(packageItem) %
                                  config.palette.length
                              ]
                            : '',
                      }}
                    >
                      {packageItem}
                    </span>
                  </Fragment>
                ))}
              </NavLink>
            ))}
          </div>
          {!isLoadingDownloadStats && packageDownloadStats && (
            <Graph
              ref={graphWrapperElementRef}
              moduleNames={packageNames}
              packageDownloadStats={packageDownloadStats ?? []}
              interval={interval}
              shouldUseLogScale={shouldUseLogScale}
              onRemovePackage={removePackage}
            />
          )}
        </div>
      </main>
      <footer>
        <div className="about">
          <span className="created-by" onClick={handleClickContributor}>
            Crafted in {contributorInfo.location} by {contributorInfo.name}
          </span>
        </div>
        <div>
          <a
            className="repo-link"
            href="https://github.com/cheapsteak/npmcharts.com/"
            target="_blank"
            title="Github Repo, star, fork, do what you will 😄"
          >
            <img src="/images/icon-github.svg" alt="Github Repo" width="16" />
          </a>
        </div>
        <small className="disclaimer">npm is a trademark of npm, Inc.</small>
      </footer>
    </div>
  );
};
