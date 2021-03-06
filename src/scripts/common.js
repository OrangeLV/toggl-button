/*jslint indent: 2, unparam: true*/
/*global document: false, MutationObserver: false, chrome: false, window: false*/
"use strict";

function $(s, elem) {
  elem = elem || document;
  return elem.querySelector(s);
}

function createTag(name, className, innerHTML) {
  var tag = document.createElement(name);
  if (className) {
    tag.className = className;
  }
  if (innerHTML) {
    tag.innerHTML = innerHTML;
  }
  return tag;
}

function createLink(className, tagName, linkHref) {
  var link;

  // Param defaults
  tagName  = tagName  || 'a';
  linkHref = linkHref || '#';
  link     = createTag(tagName, className);

  if (tagName === 'a') {
    link.href = linkHref;
  }

  link.appendChild(document.createTextNode('Start timer'));
  return link;
}

function invokeIfFunction(trial) {
  if (trial instanceof Function) {
    return trial();
  }
  return trial;
}

function createOption(name, text) {
  var option = document.createElement('option');
  option.setAttribute('value', name);
  option.text = text;
  return option;
}

function createSelect(items, defaultText) {
  var select = createTag('select');
  if (defaultText) {
    select.appendChild(createOption('', defaultText));
  }

  items.forEach(function(item) {
    select.appendChild(createOption(item.value, item.text));
  });

  return select;
}

var togglbutton = {
  isStarted: false,
  element: null,
  serviceName: '',
  tagsVisible: false,
  render: function (selector, opts, renderer) {
    chrome.extension.sendMessage({type: 'activate'}, function (response) {
      if (response.success) {
        if (opts.observe) {
          var observer = new MutationObserver(function (mutations) {
            togglbutton.renderTo(selector, renderer);
          });
          observer.observe(document, {childList: true, subtree: true});
        }
        togglbutton.renderTo(selector, renderer);
      }
    });
  },

  renderTo: function (selector, renderer) {
    var i, len, elems = document.querySelectorAll(selector);
    for (i = 0, len = elems.length; i < len; i += 1) {
      elems[i].classList.add('toggl');
    }
    for (i = 0, len = elems.length; i < len; i += 1) {
      renderer(elems[i]);
    }
  },

  getSelectedTags: function () {
    var tags = [],
      tag,
      i,
      s = document.getElementById("toggl-button-tag");
    for (i = 0; i < s.options.length; i += 1) {
      if (s.options[i].selected === true) {
        tag = s.options[i].value;
        tags.push(tag);
      }
    }
    return tags;
  },

  addEditForm: function (response) {
    if (response === null || !response.showPostPopup) {
      return;
    }
    var pid = (!!response.entry.pid) ? response.entry.pid : 0,
      projectSelect,
      handler,
      left,
      top,
      editFormHeight = 350,
      editFormWidth = 240,
      submitForm,
      updateTags,
      elemRect,
      div = document.createElement('div'),
      editForm;

    elemRect = togglbutton.element.getBoundingClientRect();
    editForm = $("#toggl-button-edit-form");



    if (editForm !== null) {
      var description = response.entry.description;
      if (description) {
        $("#toggl-button-description").value = description;
      }
      $("#toggl-button-project").value = pid;
      projectSelect = document.getElementById("toggl-button-project");
      $("#toggl-button-project-placeholder > div").innerHTML = (pid === 0) ? "Add project" : projectSelect.options[projectSelect.selectedIndex].text;
      $("#toggl-button-tag").value = "";
      editForm.style.left = (elemRect.left - 10) + "px";
      editForm.style.top = (elemRect.top - 10) + "px";
      editForm.style.display = "block";
      return;
    }

    div.innerHTML = response.html.replace("{service}", togglbutton.serviceName);
    editForm = div.firstChild;
    left = (elemRect.left - 10);
    top = (elemRect.top - 10);
    if (left + editFormWidth > window.innerWidth) {
      left = window.innerWidth - 10 - editFormWidth;
    }
    if (top + editFormHeight > window.innerHeight) {
      top = window.innerHeight - 10 - editFormHeight;
    }
    editForm.style.left = left + "px";
    editForm.style.top = top + "px";
    document.body.appendChild(editForm);

    handler = function (e) {
      if (!/toggl-button/.test(e.target.className) && !/toggl-button/.test(e.target.parentElement.className)) {
        editForm.style.display = "none";
        this.removeEventListener("click", handler);
      }
    };

    submitForm = function (that) {
      var description = $("#toggl-button-description").value;
      var request = {
        type: "update",
        description: description || '',
        pid: $("#toggl-button-project").value,
        tags: togglbutton.getSelectedTags()
      };
      chrome.extension.sendMessage(request);
      editForm.style.display = "none";
      that.removeEventListener("click", handler);
    };

    updateTags = function () {
      var tags = togglbutton.getSelectedTags();
      if (tags.length) {
        tags = tags.join(',');
      } else {
        tags = "Add tag";
      }
      $("#toggl-button-tag-placeholder > div", editForm).innerHTML = tags;
    };

    var description = response.entry.description;
    if (description) {
      $("#toggl-button-description", editForm).value = description;
    }
    $("#toggl-button-project", editForm).value = pid;
    projectSelect = $("#toggl-button-project", editForm);
    $("#toggl-button-project-placeholder > div", editForm).innerHTML = (pid === 0) ? "Add project" : projectSelect.options[projectSelect.selectedIndex].text;
    $("#toggl-button-hide", editForm).addEventListener('click', function (e) {
      editForm.style.display = "none";
      this.removeEventListener("click", handler);
    });

    $("#toggl-button-update", editForm).addEventListener('click', function (e) {
      submitForm(this);
    });

    $("form", editForm).addEventListener('submit', function (e) {
      submitForm(this);
    });

    $(".toggl-button", editForm).addEventListener('click', function (e) {
      var link;
      e.preventDefault();
      link = togglbutton.element;
      link.classList.remove('active');
      link.style.color = '';
      if (!link.classList.contains("min")) {
        link.innerHTML = 'Start timer';
      }
      chrome.extension.sendMessage({type: 'stop'}, togglbutton.addEditForm);
      editForm.style.display = "none";
      this.removeEventListener("click", handler);
      return false;
    });
    $("#toggl-button-project-placeholder", editForm).addEventListener('click', function (e) {
      var dropdown = document.getElementById('toggl-button-project'),
        event = document.createEvent('MouseEvents');
      event.initMouseEvent('mousedown', true, true, window);
      dropdown.dispatchEvent(event);
      this.removeEventListener("click", handler);
    });

    $("#toggl-button-tag-placeholder", editForm).addEventListener('click', function (e) {
      var dropdown = document.getElementById('toggl-button-tag');
      if (togglbutton.tagsVisible) {
        dropdown.style.display = "none";
        updateTags();
      } else {
        dropdown.style.display = "block";
      }
      togglbutton.tagsVisible = !togglbutton.tagsVisible;

      this.removeEventListener("click", handler);
    });

    $("#toggl-button-project", editForm).addEventListener('change', function (e) {
      projectSelect = $("#toggl-button-project");
      $("#toggl-button-project-placeholder > div", editForm).innerHTML = (projectSelect.value === "0") ? "Add project" : projectSelect.options[projectSelect.selectedIndex].text;

      this.removeEventListener("change", handler);
    });

    document.addEventListener("click", handler);
  },

  createCustomTimerLink: function (params) {
    var issue = params.issue;
    var container = createTag('div', 'toggl-button-container');
    var taskLink = createTaskLink();
    var projectSelect;
    var timerLink;
    var reportsLink;

    var taskId;
    var projectId;

    function createTaskLink() {
      taskLink = taskLink || (function() {
        var _taskLink = createLink();
        _taskLink.innerHTML = 'Create task';
        return _taskLink;
      })();
      container.appendChild(taskLink);
      return taskLink;
    }

    function removeTaskLink() {
      if (taskLink) {
        taskLink.parentNode.removeChild(taskLink);
      }
    }

    function createReportsLink() {
      reportsLink = reportsLink || (function() {
        var _reportsLink = createLink();
        _reportsLink.innerHTML = 'Reports';
        _reportsLink.addEventListener('click', function() {
          chrome.extension.sendMessage({type: 'showReports', taskId: taskId});
          return false;
        });
        return _reportsLink;
      })();
      container.appendChild(reportsLink);
      return reportsLink;
    }

    function removeReportsLink() {
      if (reportsLink) {
        reportsLink.parentNode.removeChild(reportsLink);
      }
    }

    function createProjectSelect(projectList) {
      projectSelect = projectSelect || createSelect(projectList, 'Select a Toggl project');
      container.insertBefore(projectSelect, taskLink);
      return projectSelect;
    }

    function removeProjectSelect() {
      if (projectSelect) {
        projectSelect.parentNode.removeChild(projectSelect);
      }
    }

    function createTimerLink() {
      timerLink = timerLink || togglbutton.createTimerLink({
        description: '',
        taskId: taskId,
        projectId: projectId,
        className: 'youtrack-orangelv'
      });
      container.appendChild(timerLink);
      createReportsLink();
      chrome.extension.sendMessage({type: 'spentTime', taskId: taskId}, function(response) {
        if (params.onReports) {
          params.onReports({total: response.total});
        }
      });
      return timerLink;
    }

    function removeTimerLink() {
      removeReportsLink()
      if (timerLink) {
        timerLink.parentNode.removeChild(timerLink);
      }
    }

    taskLink.addEventListener('click', function(evt) {
      removeTaskLink();
      removeProjectSelect();

      if (projectId == null) {
        createTaskLink();
        if (projectSelect) {
          createProjectSelect();
        }
        alert('Please select a Toggl project');
      } else {
        chrome.extension.sendMessage({
          type: 'createTask',
          name: issue.code + '-' + issue.id + ' - ' + issue.summary,
          estimation: issue.estimation,
          projectId: projectId
        }, function (response) {
          if (response.success) {
            taskId = response.task.id;
            createTimerLink();
          } else {
            createTaskLink();
            if (projectSelect) {
              createProjectSelect();
            }
            alert('Unable to create a task');
          }
        });
      }
    });

    chrome.extension.sendMessage({ type: 'findTask', issue: issue }, function (response) {
      if (response.success) {
        removeTaskLink();
        taskId = response.task.id;
        projectId = response.task.pid;
        createTimerLink();
      } else {
        chrome.extension.sendMessage({ type: 'findProjects', issue: issue }, function (response) {
          var projects = response.projects;
          if (projects.length == 0) {
            removeTaskLink();
            container.appendChild(document.createTextNode('No projects found'));
            container.classList.add('disabled');
          } else if (projects.length == 1) {
            projectId = projects[0].id;
          } else {
            createProjectSelect(projects.map(function(project) {
              return { value: project.id, text: project.name };
            }));

            if (projectSelect) {
              projectSelect.addEventListener('change', function(evt) {
                projectId = +projectSelect.options[projectSelect.selectedIndex].value;
              });
            }
          }
        });
      }
    });

    return container;
  },

  createTimerLink: function (params) {
    var link = createLink('toggl-button');
    function activate() {
      link.classList.add('active');
      link.style.color = '#1ab351';
      if (params.buttonType !== 'minimal') {
        link.innerHTML = 'Stop timer';
      }
    }

    function deactivate() {
      link.classList.remove('active');
      link.style.color = '';
      if (params.buttonType !== 'minimal') {
        link.innerHTML = 'Start timer';
      }
    }

    link.classList.add(params.className);
    togglbutton.serviceName = params.className;

    if (params.buttonType === 'minimal') {
      link.classList.add('min');
      link.removeChild(link.firstChild);
    }

    link.addEventListener('click', function (e) {
      var opts;
      e.preventDefault();

      if (link.classList.contains('active')) {
        deactivate();
        opts = {type: 'stop'};
      } else {
        activate();
        opts = {
          type: 'timeEntry',
          respond: true,
          taskId: invokeIfFunction(params.taskId),
          projectId: invokeIfFunction(params.projectId),
          description: invokeIfFunction(params.description),
          tags: invokeIfFunction(params.tags),
          projectName: invokeIfFunction(params.projectName),
          createdWith: 'TogglButton - ' + params.className
        };
      }
      togglbutton.element = e.target;
      chrome.extension.sendMessage(opts, togglbutton.addEditForm);

      return false;
    });

    // new button created - set state
    chrome.extension.sendMessage({type: 'currentEntry'}, function (response) {
      var description, currentEntry;
      if (response.success) {
        currentEntry = response.currentEntry;
        description = invokeIfFunction(params.description);
        if (description === currentEntry.description) {
          activate(link);
        }
      }
    });

    return link;
  },

  newMessage: function (request, sender, sendResponse) {
    if (request.type === 'stop-entry') {
      var linkText, color = '',
        link = $(".toggl-button");
      if (/active/.test(link.className)) {
        link.classList.remove('active');
        linkText = 'Start timer';
      } else {
        link.classList.add('active');
        color = '#1ab351';
        linkText = 'Stop timer';
      }
      link.style.color = color;
      link.innerHTML = linkText;
    } else if (request.type === 'sync') {
      if ($("#toggl-button-edit-form") !== null) {
        $("#toggl-button-edit-form").remove();
      }
    }
  }
};

chrome.extension.onMessage.addListener(togglbutton.newMessage);
