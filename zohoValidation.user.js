// ==UserScript==
// @name         Zoho Task Status Validation
// @namespace    blendapps.com
// @version      1.0.0
// @description  Block invalid status changes in Zoho Projects before save
// @author       Dylan Day
// @match        https://projects.blendapps.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=blendapps.com
// @updateURL    https://github.com/starlingSolutions/userscripts/raw/refs/heads/main/zohoValidation.user.js
// @downloadURL  https://github.com/starlingSolutions/userscripts/raw/refs/heads/main/zohoValidation.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /******** CONFIG ********/
    const orderedOpenStatuses = [
        'Backlog',
        'Design',
        'Pre-Development',
        'Pre-Development Review',
        'In Progress',
        'More Work Required',
        'Code Review',
        'Functional Review',
        'Staging',
        'Ready to Deploy',
    ];

    const requirements = [
        { field : 'PM Estimate',              isMissing : () => !getValue('PM Estimate (hours)'),                               maxStatus : 'Design' },
        { field : 'Primary Developer',        isMissing : () => !getValue('Primary Developer'),                                 maxStatus : 'Pre-Development' },
        { field : 'Developer Estimate',       isMissing : () => !getValue('Developer Estimate (hours)'),                        maxStatus : 'Pre-Development' },
        { field : 'Technical Scope Reviewer', isMissing : () => !getValue('Technical Scope Reviewed By'),                       maxStatus : 'Pre-Development Review' },
        { field : 'Code Pull Request',        isMissing : () => !getValue('Code Pull Request'),                                 maxStatus : 'In Progress' },
        { field : 'Passes Relevant AT',       isMissing : () => !getValue('Passes Relevant AT'),                                maxStatus : 'More Work Required' },
        { field : 'Release Note',             isMissing : () => !getValue('Release Note'),                                      maxStatus : 'In Progress' },
        { field : 'Initial Code Reviewer',    isMissing : () => !getValue('Initial Code Reviewer'),                             maxStatus : 'Code Review' },
        { field : 'Secondary Code Reviewer',  isMissing : () => !getValue('Secondary Code Reviewer'),                           maxStatus : 'Code Review' },
        { field : 'Functional Reviewer',      isMissing : () => !getValue('Functional Review By'),                              maxStatus : 'Functional Review' },
        { field : 'Docs Reviewer',            isMissing : () => getValue('Docs Pull Request') && !getValue('Docs Reviewed By'), maxStatus : 'Functional Review' },
    ];


    /******** UTILITIES ********/
    function getValue(name) {
        const label        = document.querySelector(`[aria-label=" ${name} "]`);
        const valueElement = label?.parentNode?.nextSibling?.querySelector('input, textarea');

        if (name == 'Passes Relevant AT') {
            return valueElement?.checked;
        }

        return valueElement?.value;
    }


    function indexOfStatus(status) {
        return orderedOpenStatuses.indexOf(status);
    }


    /******** CORE LOGIC ********/
    function validateStatusChange(newStatus) {
        for (const req of requirements) {
            if (req.isMissing()) {
                if (indexOfStatus(newStatus) > indexOfStatus(req.maxStatus)) {
                    return `Cannot move beyond ${req.maxStatus} without filling in ${req.field}.`;
                }
            }
        }

        return '';
    }


    /******** HOOK ********/
    function hookStatusDropdown() {
        const statusDropdowns = document.querySelectorAll('[data-id="status"]');

        if (statusDropdowns.length == 0) {
            return;
        }

        statusDropdowns.forEach(statusDropdown => statusDropdown.addEventListener('mousedown', event => {
            const selectedStatus = event.target.ariaLabel;

            if (!orderedOpenStatuses.includes(selectedStatus)) {
                return;
            }

            // Run validation function
            const alertText = validateStatusChange(selectedStatus);

            if (alertText) {
                // Prevent Zoho from selecting it by stopping propagation
                event.stopImmediatePropagation();
                event.preventDefault();

                alert(alertText);
            }
        }, true));
    }


    /******** INIT ********/
    function init() {
        // wait for task detail DOM to load
        const observer = new MutationObserver(() => {
            if (document.querySelector('[data-id="status"]')) {
                hookStatusDropdown();
            }
        });

        observer.observe(document.body, { childList : true, subtree : true });
    }


    init();
})();
