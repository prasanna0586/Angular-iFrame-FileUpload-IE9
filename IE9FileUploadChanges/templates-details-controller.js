/**
 * @ngdoc controller
 * @name RdngTemplatesDetailsController
 * @module rfng.rdng.templates
 * @requires $rootScope
 * @requires $scope
 * @requires $state
 * @requires $stateParams
 * @requires RdngTemplatesModelService
 * @requires rfngModalService
 * @requires rdngTemplatesActionsService
 * @requires rfngHeaderService
 * @requires rdngUtils
 * @requires $q
 * @requires rdngIamService
 *
 * @description
 * Controller for the Templates details page
 */

'use strict';

angular.module("rfng.rdng.templates")
        .controller("RdngTemplatesDetailsController", [
            "$rootScope",
            "$scope",
            "$state",
            "$stateParams",
            "RdngTemplatesModelService",
            "rfngModalService",
            "rdngTemplatesActionsService",
            "rfngHeaderService",
            "rdngResponseMessageService",
            "rdngUtils",
            "rdngConst",
            "$q",
            "rdngIamService",
            "rdngRestConfigService",

            function ($rootScope,
                      $scope,
                      $state,
                      $stateParams,
                      RdngTemplatesModelService,
                      rfngModalService,
                      rdngTemplatesActionsService,
                      rfngHeaderService,
                      rdngResponseMessageService,
                      rdngUtils,
                      rdngConst,
                      $q,
                      rdngIamService,
                      rdngRestConfigService) {

                // Authorization
                $scope.authTemplateLibrary = {
                    canAddOrEditTemplate: false,
                    canDeleteTemplate: false
                };

                rdngIamService.isPermissionExists(rdngConst.Resources.DOC_TEMPLATES + '.' + rdngConst.Operations.Update).then(function (status) {
                    $scope.authTemplateLibrary.canAddOrEditTemplate = status;  // Doc.Templates.Update
                });

                rdngIamService.isPermissionExists(rdngConst.Resources.DOC_TEMPLATES + '.' + rdngConst.Operations.Delete).then(function (status) {
                    $scope.authTemplateLibrary.canDeleteTemplate = status;     // Doc.Templates.Delete
                });

                $scope.rdngTextOptions = {type: 'TextBox'};
                $scope.rdngTextAreaOptions = {type: 'TextArea'};

                /**
                 * @description
                 * Listener which gets invoked before navigating to other pages using step selection
                 * When Creating a template other step selection will be in disabled state
                 * When Editing a template and if user has some unsaved changes,
                 *  then don't navigate the page confirmation modal will be shown to save OR discard current changes
                 */
                $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
                    if ($scope.canSave && !$scope.isStepNavigationAllowed && !fromState.name.match(/templates.details.history.*/) &&
                            toState.name.match(/templates.details.configuration.*/)) {
                        event.preventDefault();
                    }

                    if (fromState.name === 'templates.details.configuration.general' &&
                            toState.name === 'templates.details' && !$rootScope.willLoadFieldsPageAfterInitialTemplateCreated) {

                        event.preventDefault();
                        $state.go('templates.list');
                    }

                    $scope.isStepNavigationAllowed = false;
                });

                /**
                 * @description
                 * Whenever file uploaded in General page this call back will be listened
                 * If any error in file uploading then hasFileUploadError will have the value true
                 */
                $scope.$on('DRAG_FILENAME', function (event, eventData, hasUploadError) {
                    if (!hasUploadError) {
                        $scope.templateFile = eventData;
                        $scope.templateUrl = eventData.name;
                        // Unique index for drag and drop area component
                        $scope.markDirty(4);
                    } else {
                        $scope.templateFile = undefined;
                        $scope.templateUrl = undefined;
                    }

                    $scope.hasFileUploadError = hasUploadError;
                });
                
                $scope.validateFileForIE9 = function (file) {
                	var fullFilePath = file.value; 
                	var fileFormat = fullFilePath.substr(fullFilePath.lastIndexOf(".")+1);
                	var allowedFormat = ["odt"];
                	for (var i = 0; i < allowedFormat.length; i++) {
                		if(allowedFormat[i] === fileFormat.toLowerCase()) {
                			$scope.markDirty(4);
                			$scope.hasUploadError = false;
                			$scope.hasFileUploadError = false;
                			$scope.templateUrl = getFileName(fullFilePath);
                			$scope.templateFile = file;
                			return;
                		}
                	}
                	$scope.hasUploadError = true;
                };
                
                var getFileName = function (path){
                	var name = path.replace(/^.*[\\\/:]/, '');
                	return name;
                };

                /**
                 * @description
                 * When code has been modified in Add Template mode validate it by invoking a BE service
                 */
                $scope.$watch("scrap.code", function () {
                    if (!$scope.isNew) {
                        return;
                    }
                    $scope.isExistingCode = false;
                    if (!rdngUtils.isNullOrEmpty($scope.scrap.code)) {
                        RdngTemplatesModelService.validateCode($scope.scrap.code, templateCodeExistingSuccessHandler, templateCodeExistingErrorHandler);
                    }
                }, true);

                /**
                 * @name init
                 * @kind function
                 *
                 * @description
                 * Initialize the controller when it is called
                 */
                $scope.init = function () {
                    if (!rdngUtils.isNullOrEmpty($stateParams) && angular.isString($stateParams.code)) {
                        $scope.code = $stateParams.code;
                    }

                    // if we are editing a template then this will be overridden by the response from getTemplate
                    // OR
                    // a scrap object will be created using this
                    $scope.templateData = {
                        "code": "",
                        "name": "",
                        "description": "",
                        "enabled": 'false'
                    };

                    // Step - Tab bar Navigation details
                    $scope.tabs = [
                        {
                            "name": "Configuration",
                            "iconName": "fa-cogs"
                        },
                        {
                            "name": "History",
                            "iconName": "fa-history"
                        }
                    ];

                    // Step panel left pane data
                    $scope.steps = [
                        {
                            "name": "General",
                            "State": "",
                            "pathName": "general"
                        },
                        {
                            "name": "Fields",
                            "State": "",
                            "pathName": "fields"
                        },
                        {
                            "name": "Delivery",
                            "State": "",
                            "pathName": "delivery"
                        }/*, {
                         "name": "Inserts",
                         "State": "",
                         "pathName": "attachments"
                         }, {
                         "name": "Quality Control",
                         "State": "",
                         "pathName": "qualtiycontrol"
                         }*/
                    ];

                    // List of Templates
                    $scope.templatePublishedVersions = [];

                    // Be sure that this controller knows the modifications made in QC or Delivery tabs
                    $scope.prnt = {};
                    $scope.prnt.deliveryMethods = {};
                    $scope.prnt.deliveryProfile = {};

                    // For checking the change of '$scope.prnt.delivery'
                    $scope.prnt._deliveryMethods = {};

                    $scope.hasVersion = false;
                    $scope.isInvalidFile = false;
                    $scope.hasFileUploadError = $scope.code ? false : true;

                    if (!$scope.code) {
                        // Only for 'AddTemplate' page
                        $scope.initializeScrapDataModel();
                        return;
                    }

                    // To load the template details page, header property panel section and step panel section
                    RdngTemplatesModelService.getTemplate($scope.code, templateSuccessHandler, genericErrorHandler);

                    //Every step can register an action that will be fired before the user navigates to a new step (example: a step ca choose to let the user navigate away)
                    //These actions fall back to the default Confirmation window
                    $scope.onBeforeSelectStep = [];
                };

                /**
                 * Get the current published template's published version fileName
                 */
                var getVersionFileName = function () {
                    var templateFileName = ($scope.showingDraft && $scope.templateUrl) ? $scope.templateUrl : '';

                    if (!templateFileName && $scope.templatePublishedVersions && $scope.templatePublishedVersions.length && $scope.published) {
                        var template = _.find($scope.templatePublishedVersions, function (template) {
                            return $scope.published.activeVersion && template && template.version === $scope.published.activeVersion.version;
                        });
                        templateFileName = template ? template.filename : '';
                    }
                    return templateFileName;
                };

                /**
                 * Get the current template's draft fileName
                 */
                var getDraftFileName = function () {
                    var currentDraftFileName = $scope.templateUrl ? angular.copy($scope.templateUrl) : '';
                    if (!$scope.draft) {
                        return currentDraftFileName;
                    }

                    return currentDraftFileName ? currentDraftFileName : $scope.draft.filename;
                };

                /**
                 * @name templateSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Get the template to display it in the details page
                 * Get all the published versions for the current template and then load the page
                 *
                 * @param {Object} response - Restangular response with template model object
                 */
                var templateSuccessHandler = function (templateResponse) {
                    $scope.templateData = templateResponse.data;
                    // Get template versions by template code and store them in $scope.templatePublishedVersions
                    RdngTemplatesModelService.getVersionsByCode($scope.templateData.code, templateversionSuccessHandler, genericErrorHandler);
                };

                /**
                 * @name templateversionSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Get the list of template versions and load the current page
                 *
                 * @param {Object} response - Restangular response with template versions object
                 */
                var templateversionSuccessHandler = function (response) {
                    $scope.templatePublishedVersions = response.data;

                    // Get the template's draft and already published draft(activeVersion) object
                    $scope.initializeTemplateVersionAndDraft();
                };

                /**
                 * @name initializeTemplateVersionAndDraft
                 * @kind function
                 *
                 * @description
                 * Main function to load the template details page
                 * When a template gets edited from its list page this function will be invoked through 'getTemplate' successHandler
                 * Assign $scope.published and $scope.draft object based on the template information
                 * $scope.templateData - Template model object
                 * $scope.published    - Clone of a templateData when a templateData's activeVersion available
                 * $scope.draft        - Get draft using BE API When a templateData's draftCount > 0
                 * $scope.showingDraft - when draft available in scope this will be set to true and
                 *                       the current page will be displayed in draft mode
                 *
                 * @param {object} templateResponse - holds information about selected template's
                 *                                     meta-data name, description, code, activeVersion, draftCount, etc.
                 */
                $scope.initializeTemplateVersionAndDraft = function () {
                    rfngHeaderService.setViewTitle($scope.templateData.name);

                    // Template has a version(last published draft)
                    if ($scope.templateData.activeVersion) {
                        $scope.published = angular.copy($scope.templateData);
                        $scope.templateData.version = $scope.templateData.activeVersion.version;
                        $scope.hasVersion = true;
                    }

                    // If template has no draft load the page in version mode (READ ONLY)
                    if (!$scope.templateData.draftCount || $scope.templateData.draftCount === 0) {
                        $scope.postInitSuccess(false);
                        return;
                    }
                    $scope.draft = undefined;
                    $scope.showingDraft = false;
                    // Get the draft and display the page in EDIT mode ('showingDraft')
                    RdngTemplatesModelService.getDraft($scope.templateData.code, templateDraftsSuccessHandler, genericErrorHandler);
                };

                /**
                 * @name templateDraftsSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Get draft for the current template
                 * $scope.draft - current template's draft object
                 * Every changes over existing data that was rendered in the template details page will be
                 * saved as a new draft OR if draft exists updated in the existing one and the same can be
                 * returned while editing template
                 *
                 * @param {Object} response - draft object that contains 'template' attribute which shares
                 *                             the template information
                 */
                var templateDraftsSuccessHandler = function (response) {
                    if (response.data && response.data.length) {
                        $scope.draft = response.data[0];
                        $scope.getDraftHistoryAndUpdateHeaderInfo();
                    }

                    // Initialize header property panel and set the the template details page informations
                    $scope.postInitSuccess(false);
                };

                /**
                 * @name updateTemplateSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Template's meta info (name, description) update success callback
                 * $scope.scrap - User will interact only with this model data to change the existing draft
                 * OR version details. In order to reflect the changes, * to header property panel
                 * we need updated templateInformation which was '$scope.scrap'
                 * as this one is sent in the request assign the same to template on its success
                 * Restangular response data will be empty for PUT request
                 */
                var updateTemplateSuccessHandler = function () {
                    _.assign($scope.templateData, {
                        name: $scope.scrap.name,
                        code: $scope.scrap.code,
                        // Update the template data to reflect changes in header property panel
                        description: $scope.scrap.description
                    });
                    $scope.getDraftHistoryAndUpdateHeaderInfo();
                    $scope.resetPageContext();
                };

                /**
                 * @name extendedOperationAfterCreatedDraft
                 * @kind function
                 *
                 * @description
                 * Call back for copyExistingVersion successHandler
                 * Upon success other operation like saveAndPublishDraft, relaod the page, etc.. will be done
                 * from the controller where 'copyExistingVersion' is invoked
                 *
                 * @Param
                 * callBackFunction - function reference passed from where 'copyExistingVersion' gets invoked
                 */
                var extendedOperationAfterCreatedDraft = function (callBackFunction) {
                    /**
                     * Actual success Handler for 'getDraftInformation' invoked inside 'copyExistingVersion'
                     * In order to do other operations based on the draft created we need to write a below closure function
                     */
                    return function (draftObjectResponse) {
                        $scope.draft = draftObjectResponse.data;
                        $scope.getDraftHistoryAndUpdateHeaderInfo();
                        $scope.resetPageContext();

                        if (callBackFunction) {
                            callBackFunction($scope.draft.id);
                        }
                    };
                };

                /**
                 * @name copyExistingVersionSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Create a draft from existing template version
                 * On click 'Edit' in template details page actually template version will be edited
                 * And when tempalte file alone gets modified then copy the existing version's
                 * data(name, description, code) with updated template file
                 *
                 * @param {function} - callBackFunction - since other page like FieldController.js uses this
                 * we need to return the response to it
                 *
                 * @returns {function} - Once draft is created, draftId location will be returned
                 */
                var copyExistingVersionSuccessHandler = function (callBackFunction) {
                    return function (draftId) {
                        //Get and apply the draft object to $scope.draft
                        RdngTemplatesModelService.getDraftInformation(draftId, extendedOperationAfterCreatedDraft(callBackFunction), genericErrorHandler);
                    };
                };

                /**
                 * @name templateCodeExistingSuccessHandler
                 * @kind function
                 *
                 * @description
                 * On new template, when user enters template code in text box, application will check
                 * for duplicate, if exists we need to show an inline error message.
                 */
                var templateCodeExistingSuccessHandler = function () {
                    $scope.isExistingCode = true;
                };

                /**
                 * @name headerSuccessCallBack
                 * @kind function
                 *
                 * @description
                 * Success callback to bind header data
                 *
                 * @param {Object} response - Restangular response object with template object
                 */
                // var headerSuccessCallBack = function (response) {
                // _.assign($scope.templateData, response.data);
                //
                // var selectedStepIndex;
                // selectedStepIndex = $scope.steps.indexOf($scope.selectedStep) + 1;
                //
                // if (selectedStepIndex === $scope.steps.length) {
                //     return;
                // }
                //
                // if (selectedStepIndex > -1) {
                //     $scope.selectedStep = $scope.steps[selectedStepIndex];
                // }
                //
                // $scope.isInvalidFile = false;
                //
                // if (!$scope.isNew) { rfngHeaderService.setViewTitle($scope.templateData.name); }
                //
                // $state.go("templates.details", {'code': $scope.templateData.code});
                // };

                var loadFieldsGridAfterCreatedDraft = function (draftObjectResponse) {
                    // $rootScope.willLoadFieldsPageAfterInitialTemplateCreated = true;
                    // $scope.draft = draftObjectResponse.data;
                    // $scope.code = $scope.scrap.code;
                    // $scope.resetPageContext();
                    //
                    // $scope.getDraftHistoryAndUpdateHeaderInfo();

                    // When draft created get the updated date and time from the template data
                    // RdngTemplatesModelService.getTemplate($scope.scrap.code, headerSuccessCallBack, genericErrorHandler);

                    $rootScope.willLoadFieldsPageAfterInitialTemplateCreated = true;
                    $state.go("templates.details", {'code': draftObjectResponse.data.template});
                };

                /**
                 * @name createDraftSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Create draft - Success callback
                 * After draft created we need to assign $scope.draft from the scrap model object and also the id returned
                 * Navigate the current step panel from General to Fields and load the header property panel
                 * only in Add template mode
                 * Note: In failure we roll back the created template by deleting it
                 *
                 * @param {string} draftId - unique id for the draft created
                 */
                var createDraftSuccessHandler = function (draftId) {
                    //Get and apply the draft object to $scope.draft
                    RdngTemplatesModelService.getDraftInformation(draftId, loadFieldsGridAfterCreatedDraft, genericErrorHandler);
                };

                /**
                 * @name templateCodeExistingErrorHandler
                 * @kind function
                 *
                 * @description
                 * On new template, when user enters template code in text box, application will check
                 * for duplicate, if not exists we need to remove inline error message if any.
                 *
                 */
                var templateCodeExistingErrorHandler = function (response) {
                    if (response.status === rdngConst.HttpStatusCodes.HSC404) {
                        $scope.isExistingCode = false;
                    } else {
                        genericErrorHandler(response);
                    }
                };

                /**
                 * @name genericErrorHandler
                 * @kind function
                 *
                 * @description
                 * generic error handler for all the error response in template service api.
                 */
                var genericErrorHandler = function (response) {
                    var responseObj = rdngResponseMessageService.getResponseObject(response, rdngConst.ApiResources.TEMPLATE);
                    if (responseObj) {
                        $scope.responseError = responseObj.message;
                    }
                };

                /**
                 * @name createTemplateErrorHandler
                 * @kind function
                 *
                 * @description
                 * When template file upload failed, revert its information that was created before                 *
                 */
                var createTemplateErrorHandler = function (response) {
                    var responseObj = rdngResponseMessageService.getResponseObject(response, rdngConst.ApiResources.TEMPLATE);
                    if (responseObj && response.status === rdngConst.HttpStatusCodes.HSC422) {
                        $scope.responseError = responseObj.message;
                        RdngTemplatesModelService.destroy($scope.scrap);
                    } else {
                        genericErrorHandler(response);
                    }
                };

                /**
                 * @name draftInfoSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Get draft Information using its id
                 * $scope.draft - current template's draft object
                 *
                 * @param {Object} draftObjectResponse
                 */
                var draftInformationSuccessHandler = function (draftObjectResponse) {
                    $scope.draft = draftObjectResponse.data;

                    $scope.getDraftHistoryAndUpdateHeaderInfo();
                    $scope.resetPageContext();
                };

                /**
                 * @name updateDraftSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Create/Update draft - success callback
                 * When a template that has only version get edited and on save we invoke 'createDraft'
                 * When a template has draft and get edited and on save we invoke 'updateDraft'
                 * For the above both invocation we handled in one single success handler given below
                 *
                 * @param {string} draftId - optional. Only for create draft scope this will be set and returned.
                 */
                var updateDraftSuccessHandler = function (draftId) {
                    //When draft created firstCondition executed OR else updated second one executed
                    var draftObjId = angular.isString(draftId.id) ? draftId.id : ($scope.draft ? $scope.draft.id : '');

                    if (!draftObjId) {
                        return;
                    }

                    //Get and apply the draft object to $scope.draft
                    RdngTemplatesModelService.getDraftInformation(draftObjId, draftInformationSuccessHandler, genericErrorHandler);
                };

                /**
                 * @name publishDraftSuccessHandler
                 * @kind function
                 *
                 * @description
                 * Display the current page in version(read-only) mode - publish draft successCallback
                 * Make sure to clear the data for scrap and draft as the page need to show in version mode
                 * If user publish a draft for the first time they will select/deselect the enable checkBox
                 * based on that set the template status
                 *
                 * @param {object} publishedDraftVresion - version that was published
                 */
                var publishDraftSuccessHandler = function (publishedDraftVresion) {
                    if (publishedDraftVresion) {
                        //Make sure to discard the draft once it get published successfully
                        $scope.draft = undefined;
                        // User has been completed editing the page and reset the scrap object
                        $scope.scrap = undefined;

                        if ($scope.data && $scope.data.enabled) {
                            if (!$scope.data.enabled) {
                                $scope.templateData.enabled = false;
                                RdngTemplatesModelService.status($scope.templateData);
                            } else {
                                $scope.templateData.enabled = true;
                                RdngTemplatesModelService.status($scope.templateData);
                            }
                        }

                        //Get the published template object - reload the page
                        //while reloading we reset the page context
                        RdngTemplatesModelService.getTemplate($scope.templateData.code, templateSuccessHandler, genericErrorHandler);
                    }
                };

                /**
                 * @name doPublishDraftUponRetrievingDraftHistory
                 * @kind function
                 *
                 * @description
                 * Before invoke Publish draft API retrieve the draft history
                 * Decide how the draft going to get published major/minor
                 * if the draft history has any template document that was uploaded
                 * then publish that as major version if not minor going to be published
                 *
                 * @param {object} draftHistory - Each saved data over the draft
                 */
                var doPublishDraftUponRetrievingDraftHistory = function (draftHistory) {
                    // If current draft has any file uploaded then
                    // the same will need to be published as major or else minor
                    var isMajorVersion = rdngUtils.hasPropertyValue(draftHistory, 'action', 'UPLOADED');

                    // Get the next publish version
                    $scope.publishVersion = rdngUtils.getPublishVersion($scope.templateData, isMajorVersion);

                    if (!$scope.publishVersion) {
                        return;
                    }

                    $scope.errorMessage = '';
                    $scope.displayConfirmationModalToPublishDraft();
                };

                /**
                 * @name initializeScrapDataModel
                 * @kind function
                 *
                 * @description
                 * When 'AddTemplate' clicked from list page there will be no published version
                 * OR draft available in the $scope
                 * $scope.scrap - static templateData which declared in init() main function
                 */
                $scope.initializeScrapDataModel = function () {
                    rfngHeaderService.setViewTitle('Add Template');

                    // Scrap is user editable object from which new template and draft would be created/updated
                    $scope.scrap = angular.copy($scope.templateData);

                    $scope.templateData.name = "[Template]";
                    $scope.templateData.description = "[Template_Description]";
                    $scope.templateId = 'MULTIPLE';

                    $scope.postInitSuccess(true);
                };

                /**
                 * @name postInitSuccess
                 * @kind function
                 *
                 * @description
                 * Set the step panel selection - by default 'General' step will be selected
                 * Make sure 'SaveDraft' button not enabled until user starts editing
                 * If draft exist enable the Publish draft button
                 * Apply RFNG disabled property 'isStepEnable' to the step objects other than 'General' when "creating a new template"
                 * Ensures that $scope.templateData, $scope.published and $cope.draft has been loaded before
                 * start other operations to render the page
                 *
                 * @param {boolean} isNew - when AddTemplate clicked from Template list page then
                 *                           this will be true otherwise false always
                 */
                $scope.postInitSuccess = function (isNew) {
                    $scope.resetPageContext();

                    $scope.isNew = isNew;

                    if (!$scope.isNew) {
                        rfngHeaderService.setViewTitle($scope.templateData.name);
                    }

                    // When routing done by tab navigation check the url and select the specific Tab
                    $scope.selectedTab = $state.includes('templates.details.history') ? 1 : 0;
                    $scope.tabs[$scope.selectedTab].active = true;

                    if (!$rootScope.willLoadFieldsPageAfterInitialTemplateCreated) {

                        // RD-326 - focus should be on General tab all the time (only when entering from Templates list)
                        var currentUrl = $state.current.url.replace(/\//g, ''),
                        // Coming from the Template list the url will look like this: /:id
                                fromList = currentUrl.match(/[:]/);
                        if (fromList) {
                            $scope.selectedStep = $scope.steps[(isNew) ? 0 : 0];
                        } else {
                            $scope.selectedStep = _.find($scope.steps, function (step) {
                                return step.pathName === currentUrl;
                            });
                        }
                        $scope.selectedStep = $scope.selectedStep || $scope.steps[0];
                    } else {

                        $rootScope.willLoadFieldsPageAfterInitialTemplateCreated = false;
                        $scope.selectedStep = $scope.steps[1];
                    }

                    if (!isNew) {

                        if ($scope.templateData.draftCount > 0) {
                            // Since draft available show the page in draft mode
                            //update the scrap with draft details
                            $scope.scrap = angular.copy($scope.draft);

                            //update the scrap with tempalte details
                            _.assign($scope.scrap, {
                                name: $scope.templateData.name,
                                code: $scope.templateData.code,
                                description: $scope.templateData.description
                            });

                            $scope.canPublish = true;
                        }
                    } else {
                        for (var key in $scope.steps) {
                            if ($scope.steps[key].name && $scope.steps[key].name.toUpperCase() === 'GENERAL') {
                                $scope.steps[key].isStepEnable = $scope.isNew;
                            } else {
                                $scope.steps[key].isStepEnable = !$scope.isNew;
                            }
                        }
                    }

                    // Disables the saveDraft button by default
                    $scope.canSave = false;

                    // Manual trigger will toggle the version/draft button based on condition
                    $scope.toggleShowDraft();

                    // State change to configuration should be avoided when request comes for history details
                    if (!$state.includes('templates.details.history')) {
                        // Based on the step panel selection render the page content on the right side
                        $state.go("templates.details.configuration." + $scope.selectedStep.pathName);
                    }
                };

                /**
                 * @name toggleShowDraft
                 * @kind function
                 *
                 * @description
                 * Decides which mode(version/draft) to display the page based on boolean newTemplate,
                 * draftExists, scrapAssigned
                 *
                 * @param {object} event - trigger to avoid re-load when selecting previously selected toggle
                 */
                $scope.toggleShowDraft = function (event) {
                    if (!event) {
                        // need to be in edit mode if,
                        // new, or
                        // has draft, since draft toggle will be selected by default,
                        // has scrap, user has explicity triggered to edit
                        $scope.showingDraft = $scope.isNew || !!$scope.draft || !!$scope.scrap;
                    } else { // triggered via toggle buttons
                        if (event.currentTarget.className.indexOf('active') !== -1) {
                            return;
                        }
                        $scope.showingDraft = !$scope.showingDraft;
                    }

                    // set the header panel details
                    $scope.initHeader();
                };

                /**
                 * @name initHeader
                 * @kind function
                 *
                 * @description
                 * Based on the current mode template file name will be shown in general page
                 */
                $scope.initHeader = function () {
                    // When Creating a template don't update header with EMPTY values
                    if ($scope.isNew) {
                        return;
                    }

                    // Set filename in download link
                    $scope.download = ($scope.showingDraft && $scope.draft) ? getDraftFileName() : getVersionFileName();
                    $scope.setLastUpdatedUserAndDateTime();
                };

                /**
                 * @name setLastUpdatedUserAndDateTime
                 * @kind function
                 *
                 * @description
                 * Whenever page gets initialized OR a draft gets created/updated/published get the time stamp based on current
                 * page mode i.e. draft/version and apply that to the header property panel attribute 'lastUpdatedBy'
                 */
                $scope.setLastUpdatedUserAndDateTime = function () {

                    // Set lastUpdatedTime and lastUpdatedBy
                    //Display template's activeVersion createdBy and lastUpdatedTime when
                    //in Read mode - displaying published version info
                    //in Edit mode - draft not yet created
                    if (!$scope.showingDraft || !$scope.draft) {
                        var activeVersion = getActiveVersionFromTemplate();

                        $scope.lastUpdated = (activeVersion && activeVersion.length) ? kendo.toString(new Date(activeVersion[0].createdDtm), 'g') : '';
                        $scope.templateData.createdBy = (activeVersion && activeVersion.length) ? activeVersion[0].createdBy : '';
                        return;
                    }

                    //Display draft's createdDateTime and createdBhy when
                    //in Edit mode - draft available but has no history as its template file not gets modified
                    //i.e. draft created using 'copyExistingVersion'
                    if (!$scope.draftHistory || $scope.draftHistory.length === 0) {
                        $scope.lastUpdated = kendo.toString(new Date($scope.draft.createdDtm), 'g');
                        $scope.templateData.createdBy = $scope.draft.createdBy;
                        return;
                    }

                    //Display the date time & user name who made recent changes in it
                    //in Edit mode - draft exists and its template file has been modified atleast once before gets published
                    var timestamps = _.pluck($scope.draftHistory, 'ts');
                    var lastUpdated = Math.max.apply(Math, timestamps);

                    if (lastUpdated && !isNaN(lastUpdated)) {
                        var index = timestamps.indexOf(lastUpdated);
                        $scope.templateData.createdBy = $scope.draftHistory[index].username;
                        $scope.lastUpdated = kendo.toString(new Date(lastUpdated), 'g');
                    }
                };

                /**
                 * @name getActiveVersionFromTemplate
                 * @kind function
                 *
                 * @description
                 * Whenever a draft is published, get the lastest template's activeVersion object
                 */
                var getActiveVersionFromTemplate = function () {
                    return $scope.templatePublishedVersions ? _.where($scope.templatePublishedVersions, 'active') : [];
                };

                $scope.getCurrentVersionInformation = function () {
                    return {
                        "template": $scope.published.code,
                        "sourceVersion": $scope.published.activeVersion.version
                    };
                };
                /**
                 * @name updateTemplateName
                 * @kind function
                 *
                 * @description
                 * Call back function - Get triggered from common-directive.js
                 * Also update the draft and scrap object's value to reflect the changes done in template data
                 * Note: draft, published and scrap shares the template information so need to update those
                 * when a template updated
                 *
                 * @param {string} value - template name from UI
                 */
                $scope.updateTemplateName = function (value) {
                    RdngTemplatesModelService.updateTemplateNameandDescription({"name": value}, $scope.templateData.code)
                            .then(function () {
                                if ($scope.draft) {
                                    $scope.draft.name = value;
                                    $scope.scrap.name = value;
                                }
                            }, function (response) {
                                genericErrorHandler(response);
                                if (response.status === rdngConst.HttpStatusCodes.HSC403) {
                                    $scope.templateData.name = $scope.scrap.name;
                                }
                            });
                };

                /**
                 * @name updateTemplateDescription
                 * @kinf function
                 *
                 * @description
                 * Call back function - Get triggered from common-directive.js
                 * Note: draft, published and scrap shares the template information so need to update those when a template updated
                 *
                 * @param {string} - value - template description from UI
                 */
                $scope.updateTemplateDescription = function (value) {
                    RdngTemplatesModelService.updateTemplateNameandDescription({"description": value}, $scope.templateData.code)
                            .then(function () {
                                if ($scope.draft) {
                                    $scope.draft.description = value;
                                    $scope.scrap.description = value;
                                }
                            }, function (response) {
                                genericErrorHandler(response);
                                if (response.status === rdngConst.HttpStatusCodes.HSC403) {
                                    $scope.templateData.description = $scope.scrap.description;
                                }
                            });
                };

                /**
                 * @name displayConfigurationPageUponHistoryVersionCopiedAsDraft
                 * @kind function
                 *
                 * @description
                 * User to re-render the page after a version from history page has been assigned successfully
                 * to current template draft. Invoked from history page
                 */
                $scope.displayConfigurationPageUponHistoryVersionCopiedAsDraft = function () {
                    RdngTemplatesModelService.getTemplate($scope.code, templateSuccessHandler, genericErrorHandler);
                    $state.go("templates.details.configuration." + $scope.selectedStep.pathName);
                };

                /**
                 * @name editTemplate
                 * @kind function
                 *
                 * @description
                 * Template should have an active version
                 * User going to create a draft for the current version
                 * Render the page in draft mode by assign the scrap with the data from the template version object
                 */
                $scope.editTemplate = function () {
                    if (!$scope.published) {
                        return;
                    }

                    if (!$scope.scrap) {
                        // Since no draft available for the template assign it with version object
                        $scope.scrap = angular.copy($scope.published);
                        $scope.templateId = "0";
                    }

                    $scope.toggleShowDraft();
                };

                /**
                 * @name markDirty
                 * @kind function
                 *
                 * @description
                 * Enable / disable 'saveDraft' and 'publishDraft' button
                 * When creating a Template - name field value will be assigned to code field with EMPTY_SPACES replaced with '_'
                 * boolean 'canSave'    - If data modified and are ready to get created OR updated then enable the Save draft button
                 * boolean 'canPublish' - template has draft and nothing to save then enable the Publish Draft button
                 *
                 * @param {number} fieldIndex - unique index value passed as an argument from where user modifying the data in UI
                 */
                $scope.markDirty = function (fieldIndex) {
                    switch (fieldIndex) {
                        // Check any existing data modified while editing current one which may remain same and then set 'canSave'
                        case 1: // Name
                            $scope.isNameEdited = true;

                            if ($scope.isNew && !$scope.isCodeEdited) {
                                $scope.scrap.code = angular.copy($scope.scrap.name);
                                if ($scope.scrap.code) {//May be empty characters come through
                                    $scope.scrap.code = rdngUtils.getValidCode($scope.scrap.code, true);
                                }
                            }

                            $scope.canSave = (!(_.isEqual($scope.templateData.name, $scope.scrap.name)) || !(_.isEqual($scope.templateData.description, $scope.scrap.description)) ||
                            $scope.isDraftEdited) ? true : false;
                            break;
                        case 2: // Code
                            if ($scope.isNew) {
                                $scope.isCodeEdited = true;
                                $scope.scrap.code = rdngUtils.getValidCode($scope.scrap.code, true);
                            }
                            break;
                        case 3: // Description
                            $scope.isDescriptionEdited = true;
                            $scope.canSave = (!(_.isEqual($scope.templateData.name, $scope.scrap.name)) || !(_.isEqual($scope.templateData.description, $scope.scrap.description)) ||
                            $scope.isDraftEdited) ? true : false;
                            break;
                        case 4: // Template file upload
                            $scope.isDraftEdited = true;
                            $scope.canSave = true;
                            break;
                        case 5: // Delivery Methods checkbox
                            $scope.canSave = $scope.showingDraft && !angular.equals($scope.prnt.deliveryMethods, $scope.prnt._deliveryMethods);
                            break;
                        default:
                            $scope.canSave = true;
                            break;
                    }

                    // Publish draft button will be enabled when current template has a draft and not get modified
                    $scope.canPublish = (!$scope.canSave && $scope.draft);

                    if ($scope.isNew) { //All mandatory text field's value should be valid
                        $scope.canSave = $scope.scrap.name && $scope.scrap.code && $scope.isDraftEdited;
                    }
                };

                /**
                 * @name createTemplateDraft
                 * @kind function
                 *
                 * @description
                 * Create a template and its draft
                 * Add Template Page - SaveDraft button event
                 * First it creates a Template
                 * and on its succession creates a Draft
                 * When draft creation failed then roll back the created template by deleting it in its error handler
                 */
                $scope.createTemplateDraft = function () {
                    RdngTemplatesModelService.createTemplateDraft($scope.scrap,
                            $scope.templateFile,
                            createDraftSuccessHandler,
                            createTemplateErrorHandler);
                    $scope.isDraftEdited = false;
                };

                /**
                 * @name createDraft
                 * @kind function
                 *
                 * @description
                 * Create a draft - by editing template version's data
                 * Edit Template General Page - Save Draft button event
                 * When both template data as well as template file uploaded in General page then this will be invoked
                 */
                $scope.createDraft = function () {
                    RdngTemplatesModelService.createDraft({
                        'code': $scope.scrap.code,
                        'file': $scope.templateFile
                    }).then(updateDraftSuccessHandler, genericErrorHandler);
                };

                /**
                 * @name updateTemplate
                 * @kind function
                 *
                 * @description
                 * Update template meta-data
                 * Edit Template General Page - Save Draft button event
                 * When template data modified i.e) name, description in General page then this will be invoked
                 */
                $scope.updateTemplate = function () {
                    // Update the Template
                    RdngTemplatesModelService.updateTemplate($scope.scrap, updateTemplateSuccessHandler, genericErrorHandler);
                };

                /**
                 * @name updateDraft
                 * @kind function
                 * Update a draft - by uploading a templateFile
                 * Edit Template General Page - Save Draft button event
                 * When a template file uploaded  and draft available in General page then this will be invoked
                 */
                $scope.updateDraft = function () {
                    RdngTemplatesModelService.updateDraft($scope.templateFile, $scope.draft.id, updateDraftSuccessHandler, genericErrorHandler);
                };

                /**
                 * @name copyExistingVersion
                 * @kind function
                 *
                 * @description
                 * Copy existing template's version information and create a draft
                 * Edit Template General Page, Template Delivery Page - Save Draft button event
                 * When a template file was uploaded and no draft available in General page then this will be invoked
                 *
                 * @param {function} successCallBack - function to handle after draft created successfully
                 *                                      (also this function invoked from FieldController.js)
                 */
                $scope.copyExistingVersion = function (versionInfo, successCallBack) {
                    RdngTemplatesModelService.copyExistingVersion(versionInfo, copyExistingVersionSuccessHandler(successCallBack), genericErrorHandler);
                };

                /**
                 * @name saveAndPublishDraftCallBack
                 * @kind function
                 *
                 * @description
                 * Saves the current draft and publish the same
                 */
                $scope.saveAndPublishDraftCallBack = function () {
                    $scope.canSave = true;
                    $scope.saveDraft();
                    $scope.doPublishDraft(false, parseFloat($scope.publishVersion));
                };

                /**
                 * @name saveAndPublishDraft
                 * @kind function
                 *
                 * @description
                 * If draft not available copy existing template's version information
                 * and create a draft and then publish the same
                 * If draft available update the draft and publish the same
                 * Edit Template Delivery Page - Save Draft button event
                 * Invoked only  when data modified in delivery page
                 */
                $scope.saveAndPublishDraft = function () {
                    $scope.data = {};
                    $scope.data.content = 'Enable Template';

                    // Utility function that returns the version going to get published
                    // If no version available for the current template initial version 1.0 will be returned
                    $scope.publishVersion = rdngUtils.getPublishVersion($scope.templateData, true);

                    var modalInstance = rfngModalService.openModal({
                        templateUrl: 'views/rdng/templates/draft-publish.html',
                        scope: $scope,
                        controller: function () {
                            $scope.close = modalInstance.close;
                            $scope.save = function () {
                                if (!!($scope.publishVersion)) {
                                    if (!$scope.draft && !$scope.isDraftEdited) {
                                        $scope.copyExistingVersion($scope.getCurrentVersionInformation(), $scope.saveAndPublishDraftCallBack);
                                    } else {
                                        $scope.saveAndPublishDraftCallBack();
                                    }

                                    $scope.close();
                                } else {
                                    $scope.errorMessage = "Select at least one version";
                                    return;
                                }
                            };
                        },
                        show: true,
                        keyboard: false,
                        backdrop: 'static'
                    });
                };

                /**
                 * @name saveDraft
                 * @kind function
                 *
                 * @description
                 * If new template then display confirmation before creating the one
                 * If existing template information alone edited Update the template
                 * If both template information and also file has been uploaded then update template
                 *    if draft available update draft
                 *    If draft not available then create the one
                 * If template file alone uploaded
                 *    If draft available update it
                 *    if draft not available invoke copyExistingVersion to create draft
                 */
                $scope.saveDraft = function () {
                    // No changes exist in the current page's click event
                    if (!$scope.canSave) {
                        return;
                    }

                    if ($scope.isNew) {
                        $scope.displayConfirmationModalForNewTemplate();
                        return;
                    }
                    // Update General Page
                    // Update template and also if a template doc uploaded and draft not available then create a draft
                    if ($scope.isNameEdited || $scope.isDescriptionEdited) {
                        $scope.updateTemplate();
                        if (!$scope.draft && !$scope.isDraftEdited) {
                            $scope.copyExistingVersion($scope.getCurrentVersionInformation());
                        }
                    }
                    // Only document uploaded then Create OR Update a draft
                    if ($scope.isDraftEdited) {
                        return $scope.draft ? $scope.updateDraft() : $scope.createDraft();
                    }
                    // Update the Delivery profile
                    // TODO - console.log("Save dp: ", !angular.equals($scope.prnt.deliveryMethods, $scope.prnt._deliveryMethods));
                    if (!angular.equals($scope.prnt.deliveryMethods, $scope.prnt._deliveryMethods)) {
                        RdngTemplatesModelService.updateDeliveryProfile($scope.prnt.deliveryProfile, {
                            "deliveryMethodCodes": (function (deliveryMethods) {
                                return _.pluck(_.filter(deliveryMethods, function (dm) {
                                    return dm.selected === true;
                                }), "code");
                            })($scope.prnt.deliveryMethods)
                        });
                        $scope.prnt._deliveryMethods = _.clone($scope.prnt.deliveryMethods, true);
                    }
                };

                /**
                 * @name displayConfirmationModalForNewTemplate
                 * @kind function
                 *
                 * @description
                 * Display the confirmation modal window only for the new template before Saving the draft
                 */
                $scope.displayConfirmationModalForNewTemplate = function () {
                    var basicInfoModalDefaults = {};
                    var basicInfoModalOptions = {
                        cancelButtonText: 'No',
                        actionButtonText: 'Yes',
                        headerText: 'Save Draft',
                        bodyText: 'Once saved, the Template Code can never be modified. Are you sure you want to save?'
                    };

                    rfngModalService.showModal(basicInfoModalDefaults, basicInfoModalOptions).result.then(function (result) {
                        if (result === 'ok') {
                            setTimeout(function () {
                                $(window).trigger("resize");
                            }, 100);

                            // Two service call happens synchronously create template and then create draft
                            $scope.createTemplateDraft();
                        }
                    });
                };

                /**
                 * @name onPublishDraft
                 * @kind function
                 *
                 * @description
                 * Get the current draft history before publish the draft
                 * Need to decide whether the next version going to be minor/major in its successHandler
                 */
                $scope.onPublishDraft = function () {
                    if ($scope.draftHistory) {
                        doPublishDraftUponRetrievingDraftHistory($scope.draftHistory);
                        return;
                    }

                    RdngTemplatesModelService.getDraftHistory($scope.draft.id, doPublishDraftUponRetrievingDraftHistory, genericErrorHandler);
                };

                /**
                 * @name displayConfirmationModalToPublishDraft
                 * @kind function
                 *
                 * @description
                 * Publish the current draft if the next version available
                 */
                $scope.displayConfirmationModalToPublishDraft = function () {
                    $scope.data = {};
                    $scope.data.content = 'Enable Template';
                    var modalInstance = rfngModalService.openModal({
                        templateUrl: 'views/rdng/templates/draft-publish.html',
                        scope: $scope,
                        controller: function () {
                            $scope.close = modalInstance.close;
                            $scope.save = function () {
                                //next publish version
                                if (!!($scope.publishVersion)) {
                                    $scope.close();
                                    $scope.doPublishDraft(false, parseFloat($scope.publishVersion));
                                } else {
                                    $scope.errorMessage = "Select at least one version";
                                    return;
                                }
                            };
                        },
                        show: true,
                        keyboard: false,
                        backdrop: 'static'
                    });
                };

                /**
                 * @name doPublishDraft
                 * @kind function
                 *
                 * @description
                 * Publish the current draft
                 *
                 * @param {boolean} isNew - If current template has no active version then this will be set true
                 * @param {object} version - version that this draft going to get published
                 *                            E.g: '1.5' to left of the decimal major(1) and the right one is minor(5)
                 */
                $scope.doPublishDraft = function (isNew, version) {
                    var major, minor;
                    var versionDotSeparatorArr = version.toString().split('.');
                    major = parseInt(versionDotSeparatorArr[0]);
                    minor = parseInt(versionDotSeparatorArr.length > 1 ? versionDotSeparatorArr[1] : '0');

                    if ($scope.draft && $scope.draft.id) {
                        RdngTemplatesModelService.publishDraft($scope.templateData.code,
                                $scope.draft.id,
                                major,
                                minor,
                                publishDraftSuccessHandler,
                                genericErrorHandler);
                    }
                };

                /** Select step mechanism **/

                //Used inside selectStep() function
                //Default action (if there is no step that would overwrite this action): Opens a Confirmation modal window to save/discard the changes
                /*jshint camelcase: false */
                function selectStep_defaultModal(step) {
                    var path = 'templates.details.configuration.' + step.pathName;

                    //If canSave === false no Confirmation modal window will appear
                    if (!$scope.canSave) {
                        $scope.selectedStep = step;
                        $state.go(path);
                        return;
                    }

                    //When user has some modified data then before navigate to other pages present a confirmation dialogue
                    if ($scope.canSave) {
                        var templateChanges = {'name': $scope.scrap.name, 'description': $scope.scrap.description};
                        var templateData = {
                            'name': $scope.templateData.name,
                            'description': $scope.templateData.description
                        };

                        //Show the dialogue only when there are some modified changes in the page
                        if (!_.isEqual(templateChanges, templateData) || $scope.templateUrl !== undefined || !_.isEqual($scope.prnt._deliveryMethods, $scope.prnt.deliveryMethods)) {
                            var newScope = $rootScope.$new();

                            //Save changes checkbox
                            newScope.data = {};
                            newScope.data.checked = true;

                            //Open the Confirmation window
                            rfngModalService.showModal({scope: newScope}, {
                                cancelButtonText: 'Cancel',
                                actionButtonText: 'Submit',
                                headerText: 'Save Draft',
                                bodyTemplateUrl: "views/rdng/templates/draft-discard-changes-modal.html"
                            }).result.then(function (result) {
                                        selectStep_defaultModalResponse(step, result, "save", newScope.data.checked);
                                    });
                        } else {
                            //Reset the current page's context
                            selectStep_discardDraft();
                        }
                    }
                }

                /**
                 * Based on the button clicked in the Confirmation window take the appropriate action: save draft, save and publish draft, discard changes
                 * Used inside selectStep() function
                 * @param button {String} The clicked button (Cancel, Ok ...)
                 * @param actionType {String} The type of action to take when Submit/Ok is clicked (save, saveAndPublish)
                 * @param checkboxChecked {Boolean} Used if actionType = 'save', the checkbox's value from the Confirmation window
                 */
                /*jshint camelcase: false */
                function selectStep_defaultModalResponse(step, button, actionType, checkboxChecked) {
                    var path = 'templates.details.configuration.' + step.pathName;

                    //Discard changes on Cancel
                    if (button !== 'ok') {
                        //Reset the current page's context
                        selectStep_discardDraft();
                        //This will stop navigation to other pages and retain the current page with original data
                        $scope.isStepNavigationAllowed = false;
                        return;
                    }

                    //Set the selected step's object as next step
                    $scope.selectedStep = step;

                    //When anything else than Cancel is clicked take action based on the 'actionType'
                    switch (actionType) {
                        case "save":
                            if (checkboxChecked) {
                                $scope.saveDraft($scope.selectedStep);
                            } else {
                                selectStep_discardDraft();
                            }
                            //Navigate to the selected Tab
                            $scope.isStepNavigationAllowed = true;
                            $state.go(path);
                            break;
                        case "saveAndPublish":
                            $scope.publishVersion = rdngUtils.getPublishVersion($scope.templateData, true);

                            if (!!($scope.publishVersion)) {
                                if (!$scope.draft && !$scope.isDraftEdited) {
                                    $scope.copyExistingVersion($scope.getCurrentVersionInformation(), $scope.saveAndPublishDraftCallBack);
                                } else {
                                    $scope.saveAndPublishDraftCallBack();
                                }

                                //Navigate to the selected Tab
                                $scope.isStepNavigationAllowed = true;
                                $state.go(path);
                            } else {
                                $scope.errorMessage = "An error occured while publishing the draft!";
                            }
                            break;
                    }
                }

                //Discard a Draft
                //Used inside selectStep() function
                /*jshint camelcase: false */
                function selectStep_discardDraft() {
                    $scope.templateUrl = undefined;
                    $scope.resetPageContext();
                    $scope.scrap = angular.copy($scope.templateData);
                    // If any unsaved changes in Delivery clear that when user selects discarding those
                    if (!_.isEqual($scope.prnt._deliveryMethods, $scope.prnt.deliveryMethods)) {
                        $rootScope.$broadcast('CLEAR_DELIVERY', true);
                    }
                }

                /**
                 * @name selectStep
                 * @kind function
                 * @param {object} step - selected step object that holds which page right pane should render
                 * Step panel navigation - Render right pane content
                 */
                $scope.selectStep = function (step) {
                    if ($scope.isNew) {
                        return;
                    }

                    //Check if actions were added from the current step
                    //The default action (selectStep_defaultModal()) every step can overwrite with its own behavior (onBeforeSelectStep array)
                    if ($scope.onBeforeSelectStep && $scope.onBeforeSelectStep.length && $scope.canSave) {
                        var doContinue = true;

                        _.forEach($scope.onBeforeSelectStep, function (fn) {
                            //If an action returns a value the function execution stops
                            //That value will be treated as a promise and when resolved the draft will be saved ( but no confirmation window will be shown )
                            var returnedValue = fn({
                                version: rdngUtils.getPublishVersion($scope.templateData, true)
                            });

                            if (!_.isUndefined(returnedValue)) {
                                doContinue = false;
                                //$q.when transforms 'returnedValue' into a promise
                                $q.when(returnedValue).then(function (result) {
                                    //result is an object {button: "[the clicked button (cancel, ok)]", actionType: "[the type of action (save, saveAndPublish)]"
                                    selectStep_defaultModalResponse(step, result.button, result.actionType);
                                    if (result.button === "ok") {
                                        //Reset the actions container when clicking Submit
                                        $scope.onBeforeSelectStep = [];
                                    }
                                });
                            }
                        });

                        if (doContinue) {
                            //Fallback to the default confirmation modal
                            selectStep_defaultModal(step);
                        }
                        //No actions were added from the current step
                    } else {
                        //Fallback to the default confirmation modal
                        selectStep_defaultModal(step);
                        //Reset the actions container when clicking Submit
                        $scope.onBeforeSelectStep = [];
                    }
                };

                /**
                 * @name selectTab
                 * @kind function
                 *
                 * @description
                 * Tab bar on click UI event handler
                 *
                 * @param {number} index - which Tab selected from the array of elements rendered in Tab bar
                 * @param {object} $event - selected element attributes
                 */
                $scope.selectTab = function (index, $event) {
                    if ($($event.target).hasClass('active') || $scope.selectedTab === index) {
                        return;
                    }
                    // Set the current tab selection, make it active in UI
                    $scope.selectedTab = index;
                    $scope.tabs[index].active = true;

                    // The following will route the current page b/w Configuration and History
                    // When configuration route happens current init method will get invoked
                    if (index === 1) {
                        $state.go('templates.details.history', {code: $scope.templateData.code});
                    } else {
                        $state.go("templates.details.configuration." + $scope.selectedStep.pathName);
                    }
                };

                /**
                 * @name changeTemplateStatus
                 * @kind function
                 *
                 * @description
                 * Modify the current template status either from enabled/disabled
                 * Check whether current template's status and selected status are different
                 *
                 * @param {boolean} status - true Or false
                 * @param {object} template - current template model object
                 */
                $scope.changeTemplateStatus = function (status, template) {
                    if (status === template.enabled) {
                        return;
                    }
                    if (status) {
                        rdngTemplatesActionsService.enable(template, function () {
                            template.activated = status;
                        }, function () {
                            $scope.templateData.enabled = false;
                        });
                    } else {
                        rdngTemplatesActionsService.disable(template, function () {
                            template.activated = status;
                        }, function () {
                            $scope.templateData.enabled = true;
                        });
                    }
                };

                /**
                 * @name previewTemplate
                 * @kind function
                 *
                 * @description
                 * Preview button click event from template details page
                 */
                $scope.previewTemplate = function () {
                    var modalInstance = rfngModalService.openModal({
                        templateUrl: 'views/rdng/templates/previewtemplate.html',
                        controller: "rdngPreviewTemplatesController",
                        backdrop: 'static',
                        size: 'lg',
                        scope: $scope

                    });
                    modalInstance.result.then(function () {
                    });
                };

                /**
                 * @name downloadDraft
                 * @kind function
                 *
                 * @description
                 * Download the template file in general page
                 */
                $scope.downloadDraft = function () {
                    var baseUrl = rdngRestConfigService.getBaseUrl(rdngConst.ALEXANDRIA);
                    if ($scope.showingDraft && $scope.draft !== undefined) {
                         $scope.downloadFile = baseUrl+'/template_drafts/'+$scope.draft.id+'/files';
                    } else {
                        $scope.downloadFile = baseUrl+'/templates/'+$scope.templateData.code+'/versions/'+$scope.templateData.version+'/files';
                    }
                    window.location.assign($scope.downloadFile);
                };

                /**
                 * @name resetPageContext
                 * @kind function
                 *
                 * @description
                 * Reset the page level attributes when BE return successfull / erroneous response
                 * While discarding a draft reset the page
                 */
                $scope.resetPageContext = function () {
                    // Get the file name based on the current mode
                    $scope.download = ($scope.showingDraft && $scope.draft) ? getDraftFileName() : getVersionFileName();
                    // If Template data exists set current page as not in Edit mode
                    $scope.isNew = $scope.templateData ? false : true;
                    // User either saved the page Or not yet modified the existing content
                    $scope.canSave = false;
                    // Enable the publish draft button when draft available for the current template
                    $scope.canPublish = $scope.draft ? true : false;
                    // Reset General page content
                    $scope.isNameEdited = false;
                    $scope.isCodeEdited = false;
                    $scope.isDraftEdited = false;
                    $scope.isDescriptionEdited = false;
                    $scope.templateFile = undefined;
                    if (!$scope.showingDraft) {
                        $scope.templateUrl = undefined;
                    }
                };

                var successHandlerForHeaderUpdation = function (draftHistoryData) {
                    $scope.draftHistory = [];

                    $scope.draftHistory = angular.copy(draftHistoryData);
                    $scope.initHeader();
                };

                $scope.getDraftHistoryAndUpdateHeaderInfo = function () {
                    if (!$scope.draft || !$scope.draft.id) {
                        return;
                    }

                    RdngTemplatesModelService.getDraftHistory($scope.draft.id, successHandlerForHeaderUpdation, genericErrorHandler);
                };

                // Invoke main function after defined all other functions
                $scope.init();
            }
        ]);
