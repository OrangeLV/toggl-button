/*jslint indent: 4 */
/*global TogglButton: false*/
'use strict';

function millisecondsToString(milliseconds) {
    var result = '';
    var seconds = milliseconds / 1000;
    var years = Math.floor(seconds / 31536000);
    if (years) {
        result += years + 'y';
    }
    var weeks = Math.floor((seconds % 31536000) / 604800);
    if (weeks) {
        result += weeks + 'w';
    }
    var days = Math.floor(((seconds % 31536000) % 604800) / 86400);
    if (days) {
        result += days + 'd';
    }
    var hours = Math.floor((((seconds % 31536000) % 604800) % 86400) / 3600);
    if (hours) {
        result += hours + 'h';
    }
    var minutes = Math.floor(((((seconds % 31536000) % 604800) % 86400) % 3600) / 60);
    if (minutes) {
      result += minutes + 'm';
    }
    result += (((((seconds % 31536000) % 604800) % 86400) % 3600) % 60) + 's';
    return result;
}

togglbutton.render('.issueContainer', {}, function(container) {
    var toolbar;
    var issue = (function() {
        var result = container.querySelector('.issueId');
        if (result) {
            result = result.innerHTML.trim().split('-');
            result = {
                code: result[0],
                id: +result[1]
            };
        }
        return result;
    })();
    var summary = (function() {
        var summary = container.querySelector('.issue-summary');
        if (summary) {
            toolbar = summary.parentNode;
        }
        var result = summary;
        if (result) {
            result = result.innerHTML.trim();
        }
        return result;
    })();
    if (!issue || !summary || !toolbar) {
        return;
    }

    var estimation = (function() {
        var result = 0;
        var properties = document.querySelector('.fsi-properties');
        if (properties) {
            var property = properties.querySelector('div[title^="Estimation:"]');
            if (property) {
                var title = property.getAttribute('title');
                if (title) {
                    var matches = title.match(/Estimation:\s((\d+)w)?((\d+)d)?((\d+)h)?((\d+)m)?/i);

                    var secondsInMinute = 60;
                    var secondsInHour = secondsInMinute * 60;
                    var secondsInDay = secondsInHour * 24;
                    var secondsInWeek = secondsInDay * 7;

                    var weeks = matches[2] || 0;
                    var days = matches[4] || 0;
                    var hours = matches[6] || 0;
                    var minutes = matches[8] || 0;

                    result = weeks * secondsInWeek + days * secondsInDay + hours * secondsInHour + minutes * secondsInMinute;
                }
            }
        }
        return result;
    })();

    var link = togglbutton.createCustomTimerLink({
        issue: {
          code: issue.code,
          id: issue.id,
          summary: summary,
          estimation: estimation,
        },
        onReports: function(data) {
            var table = document.querySelector('table.fsi-properties tbody');
            var row = document.createElement('tr');

            var label = document.createElement('div');
            label.className = 'fsi-property-label';
            label.appendChild(document.createTextNode('Toggl summary'));

            var value = document.createElement('div');
            value.appendChild(document.createTextNode(millisecondsToString(data.total)));

            var column = document.createElement('td');
            column.className = 'fsi-property';

            var labelColumn = column.cloneNode();
            labelColumn.appendChild(label);
            row.appendChild(labelColumn);

            var valueColumn = column.cloneNode();
            valueColumn.appendChild(value);
            row.appendChild(valueColumn);

            table.appendChild(row);
        }
    });

    toolbar.appendChild(link);
});
