import _ from 'lodash';
import {
  isSameMonth,
  format as formatDate,
  addDays,
  isSameYear,
} from 'date-fns';
import './legend.styl';

function formatInterval(startOfPeriod, interval: number) {
  const endOfPeriod = addDays(startOfPeriod, interval - 1);
  if (isSameMonth(startOfPeriod, endOfPeriod)) {
    return `${formatDate(startOfPeriod, 'MMMM Do')} - ${formatDate(
      endOfPeriod,
      'Do',
    )}, ${formatDate(startOfPeriod, 'YYYY')}`;
  } else if (isSameYear(startOfPeriod, endOfPeriod)) {
    return `${formatDate(startOfPeriod, 'MMMM Do')} - ${formatDate(
      endOfPeriod,
      'MMMM Do',
    )}, ${formatDate(startOfPeriod, 'YYYY')}`;
  }
  return `${formatDate(startOfPeriod, 'MMMM Do, YYYY')} - ${formatDate(
    endOfPeriod,
    'MMMM Do, YYYY',
  )}`;
}

export const Legend = ({
  modules,
  onPackageFocus,
  onPackageBlur,
  onLegendBlur,
  onLegendFocus,
  onRemovePackage,
  interval,
  date,
}) => {
  const sortedModules = _.orderBy(modules, module => module.entries, ['desc']);
  return (
    <div className="legend">
      <div
        className="date"
        style={{ display: interval > 1 ? 'block' : 'none' }}
      >
        {formatInterval(date, interval)}
      </div>
      <div
        className="date"
        style={{ display: interval <= 1 ? 'block' : 'none' }}
      >
        {formatDate(date, 'dddd MMMM Do, YYYY')}
      </div>
      <table className="modules">
        <tbody onMouseOver={onLegendFocus} onMouseLeave={onLegendBlur}>
          {sortedModules.map(module => (
            <tr
              className="module"
              key={module.name}
              style={{ color: module.color }}
              onMouseOver={() => onPackageFocus(module.name)}
              onMouseLeave={() => onPackageBlur(module.name)}
            >
              <td className="actions">
                <button
                  className="remove-entry-button"
                  onClick={() => onRemovePackage(module.name)}
                  title={`remove '${module.name}' from comparison`}
                >
                  <div
                    className="nub"
                    style={{
                      // @ts-expect-error Type '{ '--module-color': any; }' is not assignable to type 'Properties<string | number, string & {}>'.
                      '--module-color': module.color,
                    }}
                  ></div>
                </button>
              </td>
              <td className="name-wrapper">
                <div className="name">{module.name}</div>
              </td>
              <td className="downloads" style={{ minWidth: '4.5em' }}>
                {module.downloads.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
