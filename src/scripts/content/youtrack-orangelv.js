/*jslint indent: 4 */
/*global TogglButton: false*/
'use strict';

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
        toolbar = summary.parentNode;
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
        code: issue.code,
        id: issue.id,
        summary: summary,
        estimation: estimation
    });

    toolbar.appendChild(link);
});
