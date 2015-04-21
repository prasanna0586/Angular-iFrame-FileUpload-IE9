'use strict';

/**
 * @ngdoc service
 * @name RdngTemplatesModelService
 * @module rfng.rdng.templates
 * @requires $q
 * @requires rdngRestService
 * @requires rdngServiceHandler
 * @requires rdngUtils
 *
 * @description
 * Template services make back-end API calls to Alexandria micro service
 */

/*jslint unparam: true */
angular.module("rfng.rdng.templates")
        .service('RdngTemplatesModelService', [
            '$q',
            'rdngRestService',
            'rdngServiceHandler',
            'rdngUtils',

            function ($q,
                      rdngRestService,
                      rdngServiceHandler,
                      rdngUtils) {

                /**
                 * @name getList
                 * @description Get templates list
                 *
                 * @returns {object} - Restangular response promise object with template array list
                 */
                this.getList = function () {
                    return rdngRestService.all("templates").getList();
                };

                /**
                 * @name getDraftFields
                 * @description Get all template's draft fields
                 *
                 * @param {string} id - draft id
                 * @returns {object} - Restangular response promise object with draft's fields
                 */
                this.getDraftFields = function (id) {
                    return rdngRestService.one('template_drafts', id).one('fields').get();
                };

                /**
                 * @name getDraftField
                 * @description Get draft's field by field code
                 *
                 * @param {string} draftId - draft id
                 * @param {string} code - field code
                 * @param {function} fieldSuccessHandler - promise success callback
                 * @param {function} fieldErrorHandler - promise error callback
                 * @returns {object} - Restangular response promise object with draft's field
                 */
                this.getDraftField = function (draftId, code, fieldSuccessHandler, fieldErrorHandler) {
                    return rdngRestService.one('template_drafts', draftId).one('fields', code).get().then(
                            fieldSuccessHandler,
                            rdngServiceHandler.errorHandler(fieldErrorHandler)
                    );
                };

                /**
                 * @name getDraftHistory
                 * @description Get draft history
                 *
                 * @param {string} draftId - draft id
                 * @param {function} draftHistorySuccessHandler - promise success callback
                 * @param {function} draftHistoryErrorHandler - promise error callback
                 * @returns {object} - Restangular response promise object with draft's history
                 */
                this.getDraftHistory = function (draftId, draftHistorySuccessHandler, draftHistoryErrorHandler) {
                    return rdngRestService.one('template_drafts', draftId).one('history').get().then(
                            function(draftHistory) {
                                draftHistorySuccessHandler(draftHistory.data);
                            },
                            rdngServiceHandler.errorHandler(draftHistoryErrorHandler)
                    );
                };

                /**
                 * @name getVersionField
                 * @description Get template version's fields list
                 *
                 * @param {string} templateCode - template code
                 * @param {string} version - template version
                 * @param {string} fieldCode - field code
                 * @param {function} fieldSuccessHandler - promise success callback
                 * @param {function} fieldErrorHandler - promise error callback
                 * @returns {object} - Restangular response promise object with field object
                 */
                this.getVersionField = function (templateCode, version, fieldCode, fieldSuccessHandler, fieldErrorHandler) {
                    return rdngRestService.one('templates', templateCode)
                            .one('versions', version)
                            .one('fields', fieldCode).get().then(
                            fieldSuccessHandler,
                            rdngServiceHandler.errorHandler(fieldErrorHandler)
                    );
                };

                /**
                 * @name updateField
                 * @description Update template draft's field
                 *
                 * @param {string} id - draft id
                 * @param {object} field - field object
                 * @param {function} updateFieldSuccessHandler - promise success callback
                 * @param {function} updateFieldErrorHandler - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.updateField = function (id, field, updateFieldSuccessHandler, updateFieldErrorHandler) {
                    var fieldCode = field.code;
                    delete field.code; // to make sure that update field does not hold 'code' attribute
                    return rdngRestService.one('template_drafts', id).one('fields', fieldCode).doPUT(field, null, null, {'Content-Type': 'application/json'}).then(
                            updateFieldSuccessHandler,
                            rdngServiceHandler.errorHandler(updateFieldErrorHandler)
                    );
                };

                /**
                 * @name getVersionFields
                 * @description Get template version's fields
                 *
                 * @param {string} templateCode - template code
                 * @param {string} id - template version
                 * @returns {object} - Restangular response promise object with template fields list
                 */
                this.getVersionFields = function (templateCode, id) {
                    return rdngRestService.one('templates/' + templateCode + '/versions', id).one('fields').get();
                };

                /**
                 * @name getTemplate
                 * @description Get template by template code
                 *
                 * @param {string} code - template code
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response promise object with template data
                 */
                this.getTemplate = function (code, successCallBack, errorHandlerCallBack) {
                    return rdngRestService.one("templates", code).get().then(
                            successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack)
                    );
                };

                //Get draft template (identified by an code)
                /**
                 * @name getDraft
                 * @description Get drafts by template code
                 *
                 * @param {string} code - template code
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response promise object with drafts data
                 */
                this.getDraft = function (code, successCallBack, errorHandlerCallBack) {
                    return rdngRestService.one("templates", code).one("drafts").getList().then(
                            successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack)
                    );
                };

                //Get draft Object (identified by its id)
                /**
                * @name getDraft
                * @description Get drafts by template code
                *
                * @param {string} draftId
                * @param {function} successCallBack - promise success callback
                * @param {function} errorHandlerCallBack - promise error callback
                * @returns {object} - Restangular response promise object with drafts data
                */
                this.getDraftInformation = function (draftId, successCallBack, errorHandlerCallBack) {
                    return rdngRestService.one("template_drafts", draftId).get().then(
                        successCallBack,
                        rdngServiceHandler.errorHandler(errorHandlerCallBack)
                    );
                };

                /**
                 * @name update
                 * @description Update template
                 *
                 * @param {object} template - template model
                 * @param {object} headers - header JSON
                 * @returns {object} - Restangular response object
                 */
                this.update = function (template, headers) {
                    return rdngRestService.all("templates").doPOST(template, 'update', {}, headers);
                };


                /**
                 * @name destroy
                 * @description Delete template and dependent data.
                 *
                 * @param templates {Object} Template object
                 * @returns {object} - Restangular response object
                 */
                this.destroy = function (template, successCallBack) {
                    var self = this,
                            deferred = $q.defer();

                    // Remove Delivery profile attached to this Template
                    // Make a request to get the Delivery profile's code
                    self.getDeliveryProfile(template.code)
                            .then(function (deliveryProfiles) {
                                // Delete the Delivery request
                                self.deleteDeliveryProfile(deliveryProfiles.data.code).then(
                                        function () {
                                            // Delete the Template
                                            deferred.resolve(self.deleteTemplate(template, successCallBack, rdngServiceHandler.errorHandler()));
                                        },
                                        rdngServiceHandler.errorHandler()
                                );
                            },
                            function() {
                                // On error, delivery profile doesn't exist, delete the template
                                deferred.resolve(self.deleteTemplate(template, successCallBack, rdngServiceHandler.errorHandler()));
                            }
                    );

                    return deferred.promise;
                };

                /**
                 * @name publishDraft
                 * @description
                 * Publish template draft. It will create a new version (major or minor) based on
                 * business rules. And delete the draft.
                 *
                 * @param {string} templateCode - template code
                 * @param {string} draftId - draft id
                 * @param {string} major - template major version
                 * @param {string} minor - template minor version
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.publishDraft = function (templateCode, draftId, major, minor, successCallBack, errorHandlerCallBack) {
                    var url = "actions/templates/" + templateCode + "/publish_draft";

                    var requestPayload = {"activate": true};

                    // Optional major version.
                    // If specified - publishing creates a new MINOR version of this major version.
                    // Otherwise new Major version is created
                    if (minor !== 0) {
                        requestPayload.majorVersion = major;
                    }

                    return rdngRestService.all(url)
                            .doPOST(requestPayload, draftId, {}, {'Content-Type': 'application/json'})
                            .then(
                            function (response) {
                                var headerURL = response.headers('location').split('/').length - 1;
                                var version = response.headers('location').split('/')[headerURL];
                                successCallBack(version);
                            },
                            rdngServiceHandler.errorHandler(errorHandlerCallBack));
                };

                /**
                 * @name deleteTemplate
                 * @description Delete template
                 *
                 * @param {object} template - template model
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.deleteTemplate = function (template, successCallBack, errorHandlerCallBack) {
                    return rdngRestService
                            .one("templates/" + template.code)
                            .doDELETE()
                            .then(successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack));
                };

                /**
                * @name deleteDraft
                * @description Delete a draft
                *
                * @param {object} drafId - Existing draft location
                * @param {function} successCallBack - promise success callback
                * @param {function} errorHandlerCallBack - promise error callback
                */
                this.deleteDraft = function (draftId, successCallBack, errorHandlerCallBack) {
                    return rdngRestService
                            .one("template_drafts/" + draftId)
                            .doDELETE(null, null, {'Content-Type': 'application/json'})
                            .then(successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack));
                };

                /**
                 * @name createTemplate
                 * @description Create new template
                 *
                 * @param {object} template - template model
                 * @param {object} file - template file (Can be odt, doc, jsxml, etc.)
                 * @returns {object} - Restangular response object
                 */
                this.createTemplate = function (template, file) {
                    return rdngRestService
                            .all("templates")
                            .doPOST(template, null, {}, {'Content-Type': 'application/json'})
                            .then(function () {
                                return {'code': template.code, 'file': file};
                            });
                };

                /**
                 * @name createDraft
                 * @description Create draft
                 *
                 * @param {object} templateDetails - template model
                 * @returns {object} - Restangular response object
                 */
                this.createDraft = function (templateDetails) {
                	var templateDraft = {'template': templateDetails.code};
                	if (typeof FormData !== 'undefined') {
                		var fd = new FormData();
                		fd.append('templateDraft', new Blob([JSON.stringify(templateDraft)], {type: "application/json"}));
                		fd.append('file', templateDetails.file);

                		return rdngRestService
                		.one('template_drafts')
                		.withHttpConfig({transformRequest: angular.identity})
                		.doPOST(fd, null, undefined, {'Content-Type': undefined})
                		.then(function (success) {
                			return {
                				'templateDetails': templateDetails,
                				'id': rdngUtils.getHeaderDataFromResponse(success, 'location', true)
                			};
                		});
                	} else {
                		//IE9 Fallback for File upload
                		var deferred = $q.defer(), promise = deferred.promise;
                		var form = document.getElementById("uploadform");
                		var div = document.createElement("div");
                		div.setAttribute("id","uploaddiv");
                		div.setAttribute("name","uploaddiv");
                		form.appendChild(div);
                		var input = document.createElement("input");
                		input.setAttribute("id","templateDraft");
                		input.setAttribute("name","templateDraft");
                		input.setAttribute("type","text");
                		input.setAttribute("style","display:none");
                		input.setAttribute("value",JSON.stringify(templateDraft));
                		form.appendChild(input);
                		var iframe=document.createElement("iframe");
                		iframe.setAttribute("id","uploadIframe");
                		iframe.setAttribute("name","uploadIframe");
                		iframe.setAttribute("width","0");
                		iframe.setAttribute("height","0");
                		iframe.setAttribute("border","0");
                		iframe.setAttribute("style","width: 0; height: 0; border: none;");
                		form.parentNode.appendChild(iframe);
                		window.frames.uploadIframe.name="uploadIframe";
                		var iframeId=document.getElementById("uploadIframe");
                		var content, response = {};
                		var eventHandler=function() {
                			if (iframeId.detachEvent) {
                				iframeId.detachEvent("onload",eventHandler);
                			}
                			else {
                				iframeId.removeEventListener("load",eventHandler,false);
                			}
                			if (iframeId.contentDocument) {
                				content=iframeId.contentDocument.body.innerHTML;
                			} else if (iframeId.contentWindow){
                				content=iframeId.contentWindow.document.body.innerHTML;
                			} else if (iframeId.document) {
                				content=iframeId.document.body.innerHTML;
                			}
                			if (content) {
                				response.templateDetails = templateDetails;
                    			response.id = rdngUtils.getLastSegmentFromUrl(content);
                    			document.getElementById("uploaddiv").innerHTML=content;
                                deferred.resolve(response);
                			} else {
                				deferred.reject();
                			}     			
                			//setTimeout('iframeId.parentNode.removeChild(iframeId)',250);
                		};
                		if (iframeId.addEventListener) {
                			iframeId.addEventListener("load",eventHandler,true);
                		}
                		if (iframeId.attachEvent) {
                			iframeId.attachEvent("onload",eventHandler);
                		}
                		form.setAttribute("target","uploadIframe");
                		form.setAttribute("action","http://rddev2-alexandria1.altidev.net:25201/template_drafts");
                		form.setAttribute("method","post");
                		form.setAttribute("enctype","multipart/form-data");
                		form.setAttribute("encoding","multipart/form-data");
                		form.submit();
                		document.getElementById("uploaddiv").innerHTML="Uploading...";
                		return promise;
                	}
                };

                /**
                 * @name createTemplateDraft
                 * @description Create template draft
                 *
                 * @param {object} template - template model
                 * @param {object} templateFile - template file
                 * @param {function} successCallBack - promise success callback
                 * @param {function} failureCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.createTemplateDraft = function (template, templateFile, successCallBack, failureCallBack) {
                    return this.createTemplate(template, templateFile)
                            .then(this.createDraft)
                            .then(this.createDeliveryProfile)
                            .then(successCallBack)
                            .catch(rdngServiceHandler.errorHandler(failureCallBack));
                };

                /**
                 * @name updateTemplate
                 * @description Update template
                 *
                 * @param {object} template - template model
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.updateTemplate = function (template, successCallBack, errorHandlerCallBack) {
                    return rdngRestService
                            .one('templates', template.code)
                            .patch({
                                'name': template.name,
                                description: template.description
                            }, null, {'Content-Type': 'application/json'})
                            .then(successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack)
                    );
                };

                /**
                 * @name updateDraft
                 * @description Update draft
                 *
                 * @param {object} templateFile - template file
                 * @param {string} draftId - draft id
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.updateDraft = function (templateFile, draftId, successCallBack, errorHandlerCallBack) {
                    var fd = new FormData();
                    fd.append('templateDraft', new Blob(["{}"], {type: "application/json"}));
                    fd.append('file', templateFile);

                    return rdngRestService.one('template_drafts', draftId)
                            .withHttpConfig({transformRequest: angular.identity})
                            .doPUT(fd, null, undefined, {'Content-Type': undefined})
                            .then(successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack)
                    );
                };

                /**
                 * @name copyExistingVersion
                 * @description Create a new draft from existing template version
                 *
                 * @param {object} templateDraft
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.copyExistingVersion = function (templateDraft, successCallBack, errorHandlerCallBack) {
                    return rdngRestService.all('template_drafts')
                            .doPOST(templateDraft, null, {}, {'Content-Type': 'application/json'})
                            .then(function (response) {
                                successCallBack(rdngUtils.getHeaderDataFromResponse(response, 'location', true));
                            },
                            rdngServiceHandler.errorHandler(errorHandlerCallBack));
                };

                /**
                 * @name getVersionsByCode
                 * @description Get template version by code
                 *
                 * @param {string} code - template code
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.getVersionsByCode = function (code, successCallBack, errorHandlerCallBack) {
                    return rdngRestService.one("templates", code).one("versions").get().then(
                            successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack));
                };

                /**
                 * @name validateCode
                 * @description Check whether template code is exist
                 *
                 * @param {string} templateCode - template code
                 * @param {function} successCallBack - promise success callback
                 * @param {function} errorHandlerCallBack - promise error callback
                 * @returns {object} - Restangular response object
                 */
                this.validateCode = function (templateCode, successCallBack, errorHandlerCallBack) {
                    return rdngRestService.one('templates', templateCode).get().then(
                            successCallBack,
                            rdngServiceHandler.errorHandler(errorHandlerCallBack)
                    );
                };

                /**
                 * @name status
                 * @description Update template status (Enabled / Disabled)
                 *
                 * @param {object} template - template model
                 * @param {function} successCallBack - promise success callback
                 * @returns {object} - Restangular response object
                 */
                this.status = function (template, successCallBack) {
                    return rdngRestService
                            .one('templates', template.code)
                            .patch({enabled: template.enabled}, null, {'Content-Type': 'application/json'})
                            .then(successCallBack,
                            rdngServiceHandler.errorHandler()
                    );
                };

                /**
                 * @name fileDownloader
                 * @description Download file from back-end response
                 *
                 * @param {object} response - Restangular response object
                 */
                var fileDownloader = function (response) {
                    var filename = "",
                            success = false;
                    var disposition = response.headers('Content-Disposition');
                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        var matches = filenameRegex.exec(disposition);
                        if (matches !== null && matches[1]) {
                            filename = matches[1].replace(/['"]/g, '');
                        }
                    }
                    var blob = response.data;

                    // http://stackoverflow.com/questions/24080018/download-file-from-a-asp-net-web-api-method-using-angularjs/24129082#24129082

                    try {
                        // Try using msSaveBlob if supported
                        if (navigator.msSaveBlob) {
                            navigator.msSaveBlob(blob, filename);
                        } else {
                            // Try using other saveBlob implementations, if available
                            var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
                            if (saveBlob === undefined) {
                                throw "Not supported";
                            }
                            saveBlob(blob, filename);
                        }
                        success = true;
                    } catch (ex) {

                    }

                    if (!success) {
                        // Get the blob url creator
                        var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
                        var url;
                        if (urlCreator) {
                            // Try to use a download link
                            var link = document.createElement('a');
                            if ('download' in link) {
                                // Try to simulate a click
                                try {
                                    // Prepare a blob URL
                                    url = urlCreator.createObjectURL(blob);

                                    // Simulate clicking the download link
                                    var element = angular.element('<a/>');
                                    element.attr({
                                        href: url,
                                        target: '_blank',
                                        download: filename // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
                                    })[0].click();
                                    success = true;
                                } catch (ex) {
                                    console.log("Download link method with simulated click failed with the following exception:");
                                    console.log(ex);
                                }
                            }

                            if (!success) {
                                // Fallback to window.location method
                                try {
                                    // Prepare a blob URL
                                    // Use application/octet-stream when using window.location to force download
                                    url = urlCreator.createObjectURL(blob);
                                    window.location = url;
                                    success = true;
                                } catch (ex) {
                                    console.log("Download link method with window.location failed with the following exception:");
                                    console.log(ex);
                                }
                            }
                        }
                    }
                };

                /**
                 * @name downloadDraft
                 * @description Download template file from draft
                 *
                 * @param {string} draftId - draft id
                 * @returns {object} - Restangular response object
                 */
                this.downloadDraft = function (draftId) {
                    return rdngRestService
                            .one('template_drafts', draftId)
                            .withHttpConfig({responseType: 'blob'})
                            .get({}, {'Accept': 'application/vnd.realdoc.file+json'})
                            .then(fileDownloader, rdngServiceHandler.errorHandler(null)
                    );
                };

                /**
                 * @name downloadTemplateVersion
                 * @description Download template file from version
                 *
                 * @param {object} templateData - template model
                 * @returns {object} - Restangular response object
                 */
                this.downloadTemplateVersion = function (templateData) {
                    return rdngRestService
                            .one('templates', templateData.code)
                            .one('versions', templateData.version)
                            .withHttpConfig({responseType: 'blob'})
                            .get({}, {'Accept': 'application/vnd.realdoc.file+json'})
                            .then(fileDownloader, rdngServiceHandler.errorHandler(null)
                    );
                };

                /**
                 * @name updateTemplateNameandDescription
                 * @description Update template meta data (name, description)
                 *
                 * @param {object} template - template model
                 * @param {string} code - template code
                 * @returns {object} - Restangular response object
                 */
                this.updateTemplateNameandDescription = function (template, code) {
                    return rdngRestService
                            .one('templates', code)
                            .patch(template, null, {'Content-Type': 'application/json'});
                };

                /**
                 * Creates a new Delivery profile for a Template
                 * @param deliveryProfile {Object} Delivery profile object
                 * @return rdngRestService promise (status)
                 */
                this.createDeliveryProfile = function (response) {
                    var deliveryProfile = {
                        "templateCode": response.templateDetails.code,
                        "code": response.templateDetails.code,
                        "name": response.templateDetails.code,
                        "description": "Description for " + response.templateDetails.code
                    };

                    return rdngRestService.all("delivery_profiles")
                            .doPOST(deliveryProfile, "", null, {'Content-Type': 'application/json'})
                            .then(function () {
                                return response.id;
                            });
                };

                /**
                 * Read a delivery profile identified by the template code. This is basically filtering after template code
                 * @param templateCode {String} Template code
                 * @return rdngRestService promise (Delivery profiles list)
                 */
                this.getDeliveryProfile = function (templateCode) {
                    return rdngRestService.one("delivery_profiles", templateCode).get();
                };

                /**
                 * Updates a Delivery profile (PATCH request)
                 * @param deliveryProfileCode {String} RESTAngular object
                 * @param data {Object} Data to send to the server (patch)
                 */
                this.updateDeliveryProfile = function (deliveryProfile, data) {
                    return deliveryProfile
                            .one(deliveryProfile.code)
                            .patch({'deliveryMethodCodes': data.deliveryMethodCodes}, null, {'Content-Type': 'application/json'});
                };

                /**
                 * Delete a Delivery profile attached to a Template
                 * @param code {String} Delivery profile code
                 * @return rdngRestService promise (status)
                 */
                this.deleteDeliveryProfile = function (code) {
                    return rdngRestService.one("delivery_profiles", code).remove();
                };

                /**
                 * Return all the Delivery methods for the provided tenant
                 * @param tenantCode {String} The Tenant's identifier
                 */
                this.getDeliveryMethods = function (tenantCode) {
                    return rdngRestService.all("delivery_methods").doGET(null, {"tenantCode": tenantCode});
                };


                /**
                 * Get the values for the Inspection level (Quality control tab)
                 */
                this.getInspectionLevel = function () {
                    return rdngRestService.all("templates/configuration/quality-control/inspection-level").getList();
                };

                /**
                 * Get the values for the Acceptance quality level (Quality control tab)
                 */
                this.getAcceptanceQualityLevel = function () {
                    return rdngRestService.all("templates/configuration/quality-control/acceptance-quality-level").getList();
                };

                /**
                 * Get a list of attachments
                 * @param queryParams {Object} Optional parameters sent as POST var (filtering, sorting, ...)
                 */
                this.getAttachments = function (queryParams) {
                    if (queryParams.hasOwnProperty("template")) {
                        //TODO: Change to getList() when BE is available
                        return rdngRestService.one("templates", queryParams.template).all("attachments").customPOST(queryParams);
                    }
                };

                /**
                 * Bulk update
                 * Update an array of items (identified by their IDs)
                 * @param template {String} Template unique identificator (id/code)
                 * @param attachments {Array} Attachments to be modified
                 */
                this.updateAttachments = function (template, attachments) {
                    return rdngRestService.one("templates", template).all("attachments").customPOST(attachments, "update");
                };

                /**
                 * Remove attachments from template
                 * @param queryParams {Object} Optional parameters sent as POST var (filtering, sorting, ...)
                 */
                this.removeAttachments = function (queryParams) {
                    if (queryParams.hasOwnProperty("template")) {
                        return rdngRestService.one("templates", queryParams.template).all("attachments").customPOST(queryParams.models, "remove");
                    }
                };

                /**
                 * Add new insert to collection
                 */
                this.addNewAttachment = function (queryParams) {
                    if (queryParams.hasOwnProperty("template")) {
                        return rdngRestService.one("templates", queryParams.template).all("attachments").doPOST(queryParams.models, 'create', {}, null);
                    }
                };

            }
        ]);
