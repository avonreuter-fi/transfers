import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import { refreshApex } from '@salesforce/apex';

import createAttendees from "@salesforce/apex/InteractionCtrl.createAttendees";

import getPrimaryMemberOfHH from "@salesforce/apex/InteractionCtrl.getPrimaryMemberOfHH";

import createNewTaskRecord from "@salesforce/apex/InteractionCtrl.createNewTaskRecord";

import getInteractionTaskList from "@salesforce/apex/InteractionCtrl.getInteractionTaskList";

import getContactDetails from "@salesforce/apex/InteractionCtrl.getContactDetails";


// Changes  JIRA - ACENEW -1135
import getinterctionEventlist from '@salesforce/apex/InteractionCtrl.getinterctionEventlist';

import NAME_FIELD from '@salesforce/schema/User.Name';
import USERID_FIELD from '@salesforce/schema/User.Id';

import userId from '@salesforce/user/Id';

import PRIMARY_CONTACT_FIELD from '@salesforce/schema/Account.FinServ__PrimaryContact__c';
import ACCOUNT_RECORDTYPE_NAME_FIELD from '@salesforce/schema/Account.RecordType.Name';
import ACCOUNT_PRIMARYHOUSHOLD_FIELD from '@salesforce/schema/Account.primaryhousehold__c';
import ACCOUNT_INVESTMENTCOUNSELOR_FIELD from '@salesforce/schema/Account.Investment_Counselor__c';

import CASE_PRIMARYHOUSHOLD_FIELD from '@salesforce/schema/Case.FinServ__Household__c';
import CASE_INVESTMENTCOUNSELOR_FIELD from '@salesforce/schema/Case.Investment_Counselor__c';
import Oppo_PRIMARYHOUSHOLD_FIELD from '@salesforce/schema/Opportunity.FinServ__Household__c';
import OPPTY_ACCOUNT_FIELD from '@salesforce/schema/Opportunity.AccountId';
import CASE_ACCOUNT_FIELD from '@salesforce/schema/Case.AccountId';




import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import CONTACTID_FIELD from '@salesforce/schema/Contact.Id';

import { NavigationMixin } from 'lightning/navigation';

export default class NewInteraction extends NavigationMixin(LightningElement) {

    @api heading = "Log an Interaction";

    //Boolean tracked variable to indicate if modal is open or not default value is false as modal is closed when page is loaded 
    @track isModalOpen = false;
    //@track isTaskModalOpen = false;
    @track error;
    @track name;
    @track selectedUserList = []; //Holds the selected useId
    @track selectedContactList = [];//Holds the selected contactId
    @track _curUserSelection = [];
    @track _curContactSelection = [];
    @track userLookupId;
    @track contactLookupId;
    @track householdId;
    @track investmentCounselorId;
    //@track tempHouseholdId;
    @track caseId;
    @track oppId;
    @track interactionType;
    @track actionItemClasslist = 'slds-hidden';
    @track recordTypeId;
    @track consoleSubTabId;
    @track primaryContactId;
    @track primaryAccountId;
    @track showRelatedActionItems = false;
    @track showActionItemSpinner = false;
    @track showSpinner = false;
    @track showInteractionSummaryFields = false;
    @track interactionName;
    @track interactionId;
    @track interactionSummaryStatus;

    @track isTaskCloseModalOpen = false;
    @track selectedTasksdata;
    @track disablePublish = true;
    @track preSelectedRows = [];

    taskItemList = [];
    //taskCompleteItemList = new Set();
    taskCompleteItemList = [];
    actionItemList = [];
    @track currentUserId = userId;

    @track externalAttendees;
    @track oppId;
    @track wiredResults;
    @track data;
    // Changes  JIRA - ACENEW -1135
    @track Edata;
    @track columns = [
        {
            label: 'Task Name',
            fieldName: 'Subject',
            type: 'text',
        },
        {
            label: 'Due Date',
            type: 'date',
            fieldName: 'ActivityDate',
            typeAttributes: {
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "UTC"
            }
        },

    ];
    @track Ecolumns = [
        {
            label: 'Subject',
            fieldName: 'Subject',
            type: 'text',
        },
        {
            label: 'Start Date',
            type: 'date',
            fieldName: 'ActivityDate',
            typeAttributes: {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC"
            }
        },

    ];

    @api rId;
    @api subtabId;
    @track manageMeetingNotes;

    @api quickinteraction = false;
    @track showQuickinteraction;
    @track showLonginteraction;

    @track interactionAccountId;
    @track showHouseholdField = true;
    @track showMarkupSpinner = true;

    @api
    play() {
        this._curUserSelection = [];
        this._curContactSelection = [];
        this.quickinteraction = true;
        this.showInteractionSummaryFields = false;
        this.connectedCallback();
    }

    //To identify if the interaction is initiated from the case
    connectedCallback() {
        this.showMarkupSpinner = true;
        if (this.quickinteraction) {
            this._curContactSelection = [];
            this.showQuickinteraction = true;
            this.showLonginteraction = false;
        } else {
            this.showQuickinteraction = false;
            this.showLonginteraction = true;
        }

        if (this.rId.startsWith('500')) {
            this.caseId = this.rId;
            // Changes  JIRA - ACENEW -1135
        } else if (this.rId.startsWith('006')) {
            this.oppId = this.rId;
        }

        this.userLookupId = this.currentUserId;
        this._curUserSelection.push(this.userLookupId);
        //this.getHouseholdTaskRecords();
        this.refresh();
    }

        //Used to get the Case details
        @wire(getRecord, {
            recordId: '$caseId',
            fields: [CASE_PRIMARYHOUSHOLD_FIELD, CASE_INVESTMENTCOUNSELOR_FIELD, CASE_ACCOUNT_FIELD]
        }) wirecase({
            error,
            data
        }) {
            if (error) {
                this.showMarkupSpinner = false;
                this.error = error.body.message;
                this.showErrorMessage();
            } else if (data) {
                console.log('Investment Counselor Case==>', data.fields.Investment_Counselor__c.value);
                this.investmentCounselorId = data.fields.Investment_Counselor__c.value;
                this.householdId = data.fields.FinServ__Household__c.value;
                /* JulioS 20230620 - Make case interaction discovery aware of non-household related cases.. */
                if (this.householdId) {
                    this.getPrimaryContactDetails(data.fields.FinServ__Household__c.value);
                    this.showHouseholdField = true;
                } else {
                    this.interactionAccountId = data.fields.AccountId.value;
                    this.primaryAccountId = data.fields.AccountId.value;
                    this.showHouseholdField = false;
                    this.getInteractionAccountContactRecords();
                }
            }
        }
    
        //Used to get the opportunity details
        @wire(getRecord, {
            recordId: '$oppId',
            fields: [Oppo_PRIMARYHOUSHOLD_FIELD, OPPTY_ACCOUNT_FIELD]
        }) wireoppo({
            error,
            data
        }) {
            if (error) {
                this.showMarkupSpinner = false;
                this.error = error.body.message;
                this.showErrorMessage();
            } else if (data) {
                console.log('FinServ__Household__c opporunity==>', data.fields.FinServ__Household__c.value);
                this.householdId = data.fields.FinServ__Household__c.value;
                if (this.householdId) {
                    this.getPrimaryContactDetails(data.fields.FinServ__Household__c.value);
                    this.showHouseholdField = true;
                } else {
                    this.interactionAccountId = data.fields.AccountId.value;
                    this.primaryAccountId = data.fields.AccountId.value;
                    this.showHouseholdField = false;
                    this.getInteractionAccountContactRecords();
                }
            }
        }

    //Function to get all open task for given household
    @wire(getInteractionTaskList, { accountId: '$householdId' })
    interactionTasks(wiredResults) {
        this.wiredResults = wiredResults; // track the wiredresults value
        const { data, error } = wiredResults;
        if (data) {
            if (data.length == 0) {
                this.showMessage = true;
            } else {
                this.showMessage = false;
            }
            let tempAllRecords = Object.assign([], data.interactionTaskList);
            this.recordTypeId = data.icSelfTaskRecordTypeId;
            this.data = tempAllRecords;
            this.error = undefined;
            console.log('External Attendees before assignment==>', JSON.stringify(data.contactList));
            this.externalAttendees = data.contactList;
            console.log('External Attendees after assignment==>', JSON.stringify(this.externalAttendees));

            //this.preSelectedRows.push('00T7g00000KBuWEEA1');
        } else if (error) {
            this.showMessage = true;
            this.data = undefined;
            this.error = error.body.message;
            this.showErrorMessage();
        }
    }
    // Changes  JIRA - ACENEW -1135
    //Function to get all open event for given household
    @wire(getinterctionEventlist, { accountId: '$householdId' })
    interactionEvent(wiredResults) {
        this.wiredResults = wiredResults; // track the wiredresults value
        const { data, error } = wiredResults;
        if (data) {
            if (data.length == 0) {
                this.showMessage = true;
            } else {
                this.showMessage = false;
            }

            this.Edata = data;
            this.error = undefined;

        } else if (error) {
            this.showMessage = true;
            this.data = undefined;
            this.error = error.body.message;
            this.showErrorMessage();
        }
    }

    handleExternalAttendeeChange(event) {
        if (event.detail.value) {
            this._curContactSelection = event.detail.value;
        } else {
            this._curContactSelection = [];
        }
    }

    get options() {
        let contactlist = [];

        if (this.externalAttendees) {
            this.externalAttendees.forEach(function (element) {
                contactlist.push({ label: element["LastName"], value: element["Id"] });
            });
        }
        return contactlist;
    }

    //This will refresh wire property and return all the new tasks for given household
    @api
    refresh() {
        let returnedResults = refreshApex(this.wiredResults);
        return refreshApex(this.wiredResults);
    }



    //Function to get all open task for given household
    getHouseholdTaskRecords() {
        console.log('getting HH Task Records');
        console.log(this.householdId);
        getInteractionTaskList({ accountId: this.householdId })
            .then((result) => {
                if (result.length == 0) {
                    this.showMessage = true;
                } else {
                    this.showMessage = false;
                }
                let tempAllRecords = Object.assign([], result.interactionTaskList);
                this.recordTypeId = result.icSelfTaskRecordTypeId;
                this.data = tempAllRecords;
                this.error = undefined;
                //console.log('External Attendees before assignment==>', JSON.stringify(result.contactList));
                this.externalAttendees = result.contactList;
                //console.log('External Attendees after assignment==>', JSON.stringify(this.externalAttendees));
            })
            .catch((error) => {
                this.showMessage = true;
                this.data = undefined;
                this.error = error.body.message;
                this.showErrorMessage();
            });
    }





    //Function to get contact record assocaited with the account
    getInteractionAccountContactRecords() {
        getContactDetails({ accountId: this.interactionAccountId })
            .then((result) => {
                this.showMarkupSpinner = false;
                if (result.length == 0) {
                    this.showMessage = true;
                } else {
                    /* Apparently upstream LastName has the Full Name of the contact, so assign it here too */
                    let newResult = result.map(item => { return { Id: item.Id, Name: item.Name, FirstName: item.FirstName, LastName: item.lastName } });
                    newResult[0]['LastName'] = newResult[0]['Name'];
                    this.showMessage = false;
                    console.log('External Attendees before assignment oppty==>', JSON.stringify(result));
                    this.externalAttendees = newResult;
                    this.addContacts(newResult[0].Id);
                    console.log('External Attendees after assignment oppty==>', JSON.stringify(this.externalAttendees));
                }
            })
            .catch((error) => {
                this.showMarkupSpinner = false;
                this.showMessage = true;
                this.data = undefined;
                this.error = error.body.message;
                this.showErrorMessage();
            });
    }

    //Used to get the Account details
    @wire(getRecord, {
        recordId: '$rId',
        fields: [PRIMARY_CONTACT_FIELD, ACCOUNT_RECORDTYPE_NAME_FIELD, ACCOUNT_PRIMARYHOUSHOLD_FIELD, ACCOUNT_INVESTMENTCOUNSELOR_FIELD]
    }) wireaccount({
        error,
        data
    }) {
        if (error) {
            // If the error happens because the user started the interaction
            // from a case, rather than the account, ignore the error
            if (!this.rId.startsWith('500') && !this.rId.startsWith('006')) {
                this.error = error.body.message;
                this.showErrorMessage();
            }
        } else if (data) {
            if (data.fields.RecordType.displayValue == 'Household') {
                this.getPrimaryContactDetails(this.rId);
                this.householdId = this.rId;
                console.log('Investment Counselor HH Account==>', data.fields.Investment_Counselor__c.value);
                this.investmentCounselorId = data.fields.Investment_Counselor__c.value;
            } else if (data.fields.RecordType.displayValue == 'Person Account') {
                console.log('Investment Counselor person account==>', data.fields.Investment_Counselor__c.value);
                this.investmentCounselorId = data.fields.Investment_Counselor__c.value;
                this.householdId = data.fields.primaryhousehold__c.value;
                this.getPrimaryContactDetails(data.fields.primaryhousehold__c.value);
            }
        }
    }

    //Used to get the contact details
    @wire(getRecord, {
        recordId: '$contactLookupId',
        fields: [CONTACT_NAME_FIELD, CONTACTID_FIELD]
    }) wirecontact({
        error,
        data
    }) {
        if (error) {
            this.error = error.body.message;
            this.showErrorMessage();
        } else if (data) {
            this.name = data.fields.Name.value;
            const person = new Object();
            person.id = data.fields.Id.value;
            person.title = this.name;
            person.icon = 'standard:contact';
            this.selectedContactList.push(person);
        }
    }

    //Used to get the user details
    @wire(getRecord, {
        recordId: '$userLookupId',
        fields: [NAME_FIELD, USERID_FIELD]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
            this.error = error.body.message;
            this.showErrorMessage();
        } else if (data) {
            this.name = data.fields.Name.value;
            const person = new Object();
            person.id = data.fields.Id.value;
            person.title = this.name;
            person.icon = 'standard:user';
            this.selectedUserList.push(person);
        }
    }

    closeQuickInteractionModal() {
        this.showQuickinteraction = false;
        this.quickinteraction = false;
        // window.history.back();
        setTimeout(() => {
            this.manageMeetingNotes = '';
            const inputFields = this.template.querySelectorAll(
                'lightning-input-field'
            );
            if (inputFields) {
                inputFields.forEach(field => {
                    field.reset();

                });
            }
        }, 4000);

    }
    //This will show or hide task on button click
    showOrHideOpenTasks() {
        this.showRelatedActionItems = true;
        if (this.showRelatedActionItems) {
            this.actionItemClasslist = this.template.querySelector('[data-id="actionItems"]').classList;
            if (this.actionItemClasslist == 'slds-hidden') {
                this.actionItemClasslist.remove('slds-hidden');
            } else {
                this.actionItemClasslist.add('slds-hidden');
            }
        }
    }

    closeTaskCompleteModal() {
        this.isTaskCloseModalOpen = false;
        this.taskCompleteItemList = [];
    }
    //This will open a new model box with new task form.
    navigateToNewTask() {
        this.isModalOpen = true;
    }

    //This will close the model box
    closeModal() {
        this.isModalOpen = false;
    }

    //This will create a new task record 
    handleActionItemSuccess(event) {
        let actionIten = event.detail;
        this.createTaskRecord(actionIten);
    }

    //New task creation
    createTaskRecord(actionItemDetail) {
        let tsk = { 'sobjectType': 'Task' };
        tsk.Action_Item__c = actionItemDetail.id;
        tsk.ActivityDate = actionItemDetail.fields.Due_Date__c.value;
        tsk.Description = actionItemDetail.fields.Details__c.value;
        tsk.RecordTypeId = this.recordTypeId;
        tsk.Subject = actionItemDetail.fields.Subject__c.value;
        tsk.WhatId = actionItemDetail.fields.Account__c.value;
        tsk.WhoId = actionItemDetail.fields.Client_Name__c.value ? actionItemDetail.fields.Client_Name__c.value : this.primaryContactId;
        tsk.OwnerId = actionItemDetail.fields.Assigned_To__c.value ? actionItemDetail.fields.Assigned_To__c.value : this.investmentCounselorId;

        createNewTaskRecord({ newTaskRecord: tsk })
            .then(result => {
                let my_ids = [];
                my_ids.push(result);
                this.preSelectedRows = my_ids;

                //this.preSelectedRows.push(result);
                this.showActionItemSpinner = false;
                this.isModalOpen = false;
                this.refresh();
                //this.getHouseholdTaskRecords();
            })
            .catch(error => {
                console.log(error);
                this.error = error.body.message;
                this.showActionItemSpinner = false;
                this.isModalOpen = false;
                this.showErrorMessage();
            });
    }

    handleActionItemError(event) {
        this.showActionItemSpinner = false;
    }

    handleActionItemSubmit(event) {
        this.showActionItemSpinner = true;
    }

    //This function is used to add the external contacts to the list
    handleContactResultClick(event) {
        //Prevent from submitting the form
        event.preventDefault();
        this.contactLookupId = event.detail.fields.ContactId;
        this.addContacts(this.contactLookupId);
    }

    addContacts(contactId) {
        console.log('I am adding contacts', contactId);
        if (contactId) {
            if (this._curContactSelection.includes(contactId)) {
                console.log('Selection Includes contactId');
                return;
            }
            const newSelection = [...this._curContactSelection];
            newSelection.push(contactId);
            this._curContactSelection = newSelection;

            //Clear the input field after adding the value to the list
            const inputFields = this.template.querySelectorAll(
                'lightning-input-field[data-my-id=externalUser]'
            );
            if (inputFields) {
                inputFields.forEach(field => {
                    field.reset();
                });
            }
        }
    }

    //This function is used to add the internal contacts to the list
    handleUserResultClick(event) {
        //Prevent from submitting the form
        event.preventDefault();
        this.userLookupId = event.detail.fields.UserId;
        if (this.userLookupId) {
            if (this._curUserSelection.includes(this.userLookupId)) {
                return;
            }
            const newSelection = [...this._curUserSelection];
            newSelection.push(this.userLookupId);
            this._curUserSelection = newSelection;
        }
        //Clear the input field after adding the value to the list
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field[data-my-id=internalUser]'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        console.log('Slected Internal Users==>' + this._curUserSelection);
    }

    //Removes the selected external contact from the list
    handleRemoveSelectedContactItem(event) {
        this.selectedContactList = this.selectedContactList.filter(person => person.id != event.currentTarget.name);
        this._curContactSelection = this.selectedContactList.filter(person => person != event.currentTarget.name);
        this.contactLookupId = null;
    }
    //Removes the selected internal users from the list
    handleRemoveSelectedUserItem(event) {
        this.selectedUserList = this.selectedUserList.filter(person => person.id != event.currentTarget.name);
        this._curUserSelection = this._curUserSelection.filter(person => person != event.currentTarget.name);
        this.userLookupId = null;
    }

    //Gets the primary contact details for the seleted household record
    handleFormAccountIdChange(event) {
        this.householdId = event.target.value;
        this.getPrimaryContactDetails(event.target.value);
    }

    //Gets primary contact details
    //Parameter : householdId
    getPrimaryContactDetails(hhAccountId) {
        getPrimaryMemberOfHH({ accountId: hhAccountId })
            .then((result) => {
                this.showMarkupSpinner = false;
                this.contactLookupId = result.Id; //Added as 1337
                console.log('result.Id==>', result.Id);
                this.addContacts(result.Id);
                //this.selectedContactList.push(result.Id); 
                this.primaryContactId = result.Id;
                this.primaryAccountId = result.AccountId;
                this.error = undefined;
            })
            .catch((error) => {
                this.showMarkupSpinner = false;
                this.error = error.body.message;
                this.showErrorMessage();
            });
    }

    //Setting interaction name
    handleInteractionTypeChange(event) {
        this.interactionType = event.target.value;
        let interactionName = this.template.querySelector('[data-id="interactionName"]');
        interactionName.value = event.target.value + ' ' + new Date().toLocaleString();
        this.interactionName = event.target.value + ' ' + new Date().toLocaleString();
    }

    //This will close the subtab on cancel or sucessfull submission of interaction record
    closeSubTab() {
        this.invokeWorkspaceAPI('getFocusedTabInfo').then(focusedTab => {
            if (focusedTab.tabId) {
                this.invokeWorkspaceAPI('closeTab', {
                    tabId: focusedTab.tabId

                });
            }
            console.log('OUTPUT : ', focusedTab.tabId);
        }).catch(err => {
            setTimeout(() => {
                window.history.back();
                this.manageMeetingNotes = '';
                const inputFields = this.template.querySelectorAll(
                    'lightning-input-field'
                );
                if (inputFields) {
                    inputFields.forEach(field => {
                        field.reset();

                    });
                }

            }, 2000);
        });

    }

    invokeWorkspaceAPI(methodName, methodArgs) {
        return new Promise((resolve, reject) => {
            const apiEvent = new CustomEvent("internalapievent", {
                bubbles: true,
                composed: true,
                cancelable: false,
                detail: {
                    category: "workspaceAPI",
                    methodName: methodName,
                    methodArgs: methodArgs,
                    callback: (err, response) => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve(response);
                        }
                    }
                }
            });

            window.dispatchEvent(apiEvent);
        });
    }

    handleTableSelectedRows(event) {
        const selectedRows = event.detail.selectedRows;
        console.log('Selected Rows', JSON.stringify(selectedRows));
        if (selectedRows.length > 0) {
            this.disablePublish = false;
        } else {
            this.disablePublish = true;
        }
    }

    handleSkip() {
        this.taskCompleteItemList = [];
        this.handleSubmitDetails();
    }

    taskCompleteSubmitDetails() {
        var el = this.template.querySelector('lightning-datatable[data-my-id=interactionTaskCompleteTable]')
        var selectedRows = el.getSelectedRows();
        if (selectedRows) {
            selectedRows.forEach(element => {
                this.taskCompleteItemList.push(element.Id);
            });
        }
        console.log('CompletedTasks==>' + JSON.stringify(this.taskCompleteItemList));
        this.handleSubmitDetails();
    }
    //Submits form and status of the interaction summary is updated to 'Published'
    submitDetails() {
        console.log('Submitting the form');
        console.log('Quick Interaction' + this.quickinteraction);
        console.log('householdIsNull' + this.showHouseholdField);
        if (this.quickinteraction) {
            this.showSpinner = true;
            let interactionName = this.template.querySelector('[data-id="interactionName"]');
            interactionName.value = 'Left Message' + ' ' + new Date().toLocaleString();
            this.interactionName = 'Left Message' + ' ' + new Date().toLocaleString();
            this.handleSubmitDetails();
            //this.closeQuickInteractionModal();
        } else {
            if (this.showHouseholdField) {
                var el = this.template.querySelector('lightning-datatable[data-my-id=interactionTaskTable]')
                this.selectedTasksdata = el.getSelectedRows();
                //Adding new logic to complete task PCGYT-1226
                //check if any tasks are selected 
                if (this.selectedTasksdata === undefined || this.selectedTasksdata.length == 0) {
                    // array empty or does not exist
                    this.handleSubmitDetails();
                } else {
                    //show model to close the tasks
                    this.isTaskCloseModalOpen = true;
                }
            } else {
                this.handleSubmitDetails();
            }
        }

    }

    handleSubmitDetails() {
        console.log('Submitting the Details step 2');
        this.isTaskCloseModalOpen = false;
        this.interactionSummaryStatus = 'Published';
        this.showInteractionSummaryFields = true;
        this.showSpinner = true;
        this.template.querySelector('lightning-record-edit-form[data-my-id=interactionForm]').submit();


    }

    //Submits draft form and status of the interaction summary is updated to 'Draft'
    submitDraftDetails() {
        this.interactionSummaryStatus = 'Draft';
        this.showInteractionSummaryFields = true;
        this.showSpinner = true;
        this.template.querySelector('lightning-record-edit-form[data-my-id=interactionForm]').submit();
    }

    //Any error on the interaction submittion will turn off the spinner
    handleInteractionError() {
        this.showSpinner = false;
    }

    //Handelling the interaction success submission form and executing the rest of the logic
    handleInteractionSuccess(event) {
        console.log('Interaction Submit Success==>' + JSON.stringify(event.detail));
        try {
            if (event.detail.fields.hasOwnProperty('Case__c')) {
                let interactionSummaryCaseId = this.template.querySelector('[data-id="InteractionSummaryCaseId"]');
                interactionSummaryCaseId.value = event.detail.fields.Case__c.value;
            }
            let interactionSummaryStatus = this.template.querySelector('[data-id="interactionSummaryStatus"]');
            interactionSummaryStatus.value = this.interactionSummaryStatus;
            let interactionSummaryName = this.template.querySelector('[data-id="interactionSummaryName"]');
            interactionSummaryName.value = this.interactionName;
            let interactionSummaryPartnerAccount = this.template.querySelector('[data-id="InteractionSummaryPartnerAccountId"]');
            interactionSummaryPartnerAccount.value = this.householdId;
            let interactionId = this.template.querySelector('[data-id="InteractionSummaryInteractionId"]');
            interactionId.value = event.detail.id;
            let interactionSummaryAccountId = this.template.querySelector('[data-id="InteractionSummaryAccountId"]');
            interactionSummaryAccountId.value = this.primaryAccountId;
            this.interactionId = event.detail.id;
            let meetingNotesId = this.template.querySelector('[data-id="MeetingNotesId"]');
            let MeetingNotesText = this.template.querySelector('[data-id="meetingNotesText"]');
            meetingNotesId.value = MeetingNotesText.value.replace(/\r?\n/g, '<br />');
            this.template.querySelector('lightning-record-edit-form[data-my-id=interactionSummaryForm]').submit();
            this.actionItemList = [];
            this.taskItemList = [];
        }
        catch (err) {
            console.error('Interaction Summery' + err.message);
            this.error = 'Please enter worknote';
            this.showErrorMessage();
            this.showSpinner = false;
        }
    }

    //Handelling the interaction summary success
    handleInteractionSummarySuccess() {
        console.log('InteractionSummary Success==>');
        console.log('Is Quick Interaction==>' + this.quickinteraction);
        console.log('Current Contact Selection==>' + this._curContactSelection);
        if (this.showHouseholdField) {
            if (this.quickinteraction == false) {
                var el = this.template.querySelector('lightning-datatable[data-my-id=interactionTaskTable]')
                var selectedRows = el.getSelectedRows();
                if (selectedRows) {
                    selectedRows.forEach(element => {
                        if (element.hasOwnProperty('Action_Item__c')) {
                            this.actionItemList.push(element.Action_Item__c);
                        } else {
                            this.taskItemList.push(element.Id);
                        }
                        this.selectedTasksdata.push(element);

                        //this.taskCompleteItemList.push(element.Id);
                    });
                }
            } else {
                this._curContactSelection = [];
            }
        }

        console.log('Creating Attendees==>');
        console.log('Current Contact Selection After==>' + this._curContactSelection);
        console.log('Current User Selection After==>' + this._curUserSelection);

        createAttendees({ userIdList: this._curUserSelection, contactIdList: this._curContactSelection, interactionId: this.interactionId, actionItemList: this.actionItemList, taskItemList: this.taskItemList, taskCompleteItemList: this.taskCompleteItemList })
            .then((result) => {
                this.showSpinner = false;
                console.log('Created Attendees');
                if (this.quickinteraction == false) {
                    this.closeSubTab();
                }
                this.showToast();
                this.error = undefined;
                this.refresh();
                this.closeQuickInteractionModal();
            })
            .catch((error) => {
                this.showSpinner = false;
                this.error = error.body.message;
                this.showErrorMessage();
                this.refresh();
                //this.closeQuickInteractionModal();
            });
    }

    //Showing success message for the successfull submission of interaction
    showToast() {
        console.log('Success Message');
        const event = new ShowToastEvent({
            title: 'Success',
            message: 'Interaction Record Created Successfully',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    showErrorMessage() {
        const event = new ShowToastEvent({
            title: 'Message',
            message: this.error,
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

}
