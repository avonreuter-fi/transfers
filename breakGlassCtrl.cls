/**
* @description       : The class is used to grant access to account object based on the search criteria.(PCGYT-1884)(PCGYT-2254)(PCGYT-2255)(PCGYT-3662)
* @author            : Sai Jikkidi
* @group             : 
* @last modified on  : 06/13/2023
* @last modified by  : Change Me
* @user story        : PCGYT-3662
**/
public without sharing class BreakGlassCtrl {
    
    // Wrapper Class
    @TestVisible
    public class BreakGlassItemWrpr{
        @AuraEnabled
        public List<Account> accountList {get; set;}
        @AuraEnabled
        public String result {get; set;}
        @AuraEnabled
        public String recordId {get; set;}
        
        public BreakGlassItemWrpr(List<Account> accountList, String result,String recordId){
            this.accountList = accountList;
            this.result = result;
            this.recordId = recordId;
        }
    }
    
    
    @AuraEnabled
    public static BreakGlassItemWrpr getAccount(string CID,string FirstName,string LastName,string Phone,string Email,string SSN,string CustodianAccntNo,string FinAccntNo,string AID,string CaseNo) {
        List<Account> accountList = new List<Account>();
        List<FinServ__FinancialAccount__c> finAccntList = new List<FinServ__FinancialAccount__c>();
        List<Case> caseList = new List<Case>();
        String result = '';
        String recordId = '';
        string soql = 'SELECT Id,RecordType.Name,Service__c,Service_fromIRIS__c FROM Account @WHERE @CID @FirstName @LastName @Phone @PersonEmail @SSN LIMIT 2';
        string finAccntsoql = 'SELECT Id,FinServ__PrimaryOwner__c,FinServ__Household__c FROM FinServ__FinancialAccount__c @WHERE @CustodianAccntNo @FinAccntNo @AID LIMIT 1';
        string casesoql = 'SELECT Id,ContactId,Contact.AccountId,CaseNumber FROM Case WHERE @CaseNumber LIMIT 1';
        try {
            // en: 'lIMIT'
            String Id = '';
            boolean hasConstraint = false;
            boolean hasFinConstraint = false;
            
            //CaseNo
            if ((CaseNo != null) && (CaseNo.trim() != '')) {
                casesoql = casesoql.replace('@CaseNumber', 'CaseNumber = \'' + CaseNo + '\'');
            } else {
                casesoql = casesoql.replace('@CaseNumber', '');
            }
            
            //CustodianAccntNo
            if ((CustodianAccntNo != null) && (CustodianAccntNo.trim() != '')) {
                finAccntsoql = finAccntsoql.replace('@CustodianAccntNo', 'Custodian_Account_Number__c = \'' + CustodianAccntNo + '\'');
                hasFinConstraint = true;
            } else {
                finAccntsoql = finAccntsoql.replace('@CustodianAccntNo', '');
            }
            
            //FinAccntNo
            if ((FinAccntNo != null) && (FinAccntNo.trim() != '')) {
                if (hasFinConstraint == true)
                {
                    finAccntsoql = finAccntsoql.replace('@FinAccntNo', ' OR FIN_Account_Number__c = \'' + FinAccntNo + '\'');    
                } else {
                    finAccntsoql = finAccntsoql.replace('@FinAccntNo', 'FIN_Account_Number__c = \'' + FinAccntNo + '\'');
                }
                hasFinConstraint = true;
            } else {
                finAccntsoql = finAccntsoql.replace('@FinAccntNo', '');
            }
            
            
            //AID
            if ((AID != null) && (AID.trim() != '')) {
                if (hasFinConstraint == true)
                {
                    finAccntsoql = finAccntsoql.replace('@AID', ' OR AID_Account_Number__c = \'' + AID + '\'');    
                } else {
                    finAccntsoql = finAccntsoql.replace('@AID', 'AID_Account_Number__c = \'' + AID + '\'');
                }
                hasFinConstraint = true;
            } else {
                finAccntsoql = finAccntsoql.replace('@AID', '');
            }
            
            
            
            //CID
            if ((CID != null) && (CID.trim() != '')) {
                soql = soql.replace('@CID', 'CID__c = \'' + CID + '\'');
                hasConstraint = true;
            } else {
                soql = soql.replace('@CID', '');
            }
            
            //First Name
            if ((FirstName != null) && (FirstName.trim() != '')) {
                if (hasConstraint == true)
                {
                    soql = soql.replace('@FirstName', ' AND FirstName LIKE \'' + FirstName +'%' +'\'');    
                } else {
                    soql = soql.replace('@FirstName', 'FirstName LIKE \'' + FirstName + '%' +'\'');
                }
                hasConstraint = true;
            } else {
                soql = soql.replace('@FirstName', '');
            }
            
            //Last Name
            if ((LastName != null) && (LastName.trim() != '')) {
                if (hasConstraint == true)
                {
                    soql = soql.replace('@LastName', ' AND LastName = \'' + LastName + '\'');    
                } else {
                    soql = soql.replace('@LastName', 'LastName = \'' + LastName + '\'');
                }
                hasConstraint = true;
            } else {
                soql = soql.replace('@LastName', '');
            }
            
            //Phone
            if ((Phone != null) && (Phone.trim() != '')) {
                if (hasConstraint == true)
                {
                    soql = soql.replace('@Phone', ' AND Phone = \'' + Phone + '\'');    
                } else {
                    soql = soql.replace('@Phone', 'Phone = \'' + Phone + '\'');
                }
                hasConstraint = true;
            } else {
                soql = soql.replace('@Phone', '');
            }
            
            
            //PersonEmail
            if ((Email != null) && (Email.trim() != '')) {
                if (hasConstraint == true)
                {
                    soql = soql.replace('@PersonEmail', ' AND PersonEmail = \'' + Email + '\'');    
                } else {
                    soql = soql.replace('@PersonEmail', 'PersonEmail = \'' + Email + '\'');
                }
                hasConstraint = true;
            } else {
                soql = soql.replace('@PersonEmail', '');
            }
            
            //SSN
            if ((SSN != null) && (SSN.trim() != '')) {
                if (hasConstraint == true)
                {
                    soql = soql.replace('@SSN', ' AND SSN_Tax_ID_Last_Four_Digits__pc =  \'' + SSN + '\'');    
                } else {
                    soql = soql.replace('@SSN', 'SSN_Tax_ID_Last_Four_Digits__pc =  \'' + SSN + '\'');
                }
                hasConstraint = true;
            } else {
                soql = soql.replace('@SSN', '');
            }
            
            if (hasFinConstraint == true)
            {
                finAccntsoql = finAccntsoql.replace('@WHERE', 'WHERE');
            } else {
                finAccntsoql = finAccntsoql.replace('@WHERE', '');
            }
            
            if (hasConstraint == true)
            {
                soql = soql.replace('@WHERE', 'WHERE');
                finAccntsoql = finAccntsoql.replace('@WHERE', 'WHERE');
                casesoql = casesoql.replace('@WHERE', 'WHERE');
            } else {
                soql = soql.replace('@WHERE', '');
                finAccntsoql = finAccntsoql.replace('@WHERE', '');
                casesoql = casesoql.replace('@WHERE', '');
            }

            //Check if any account found with the financial Account details PCGYT-2255
            if(String.isNotBlank(CustodianAccntNo) || String.isNotBlank(FinAccntNo)  || String.isNotBlank(AID)){
                system.debug('finAccntsoql==>'+finAccntsoql);
                
                finAccntList = Database.query(finAccntsoql);
                system.debug('finAccntList==>'+finAccntList);
                if(!finAccntList.isEmpty()){
                    if(finAccntList[0].FinServ__PrimaryOwner__c != null){
                        accountList = getPrimaryAccount(finAccntList[0].FinServ__PrimaryOwner__c);
                        recordId = finAccntList[0].FinServ__Household__c;
                    }
                }
            }
			system.debug('accountList after fin==>'+accountList);
            //Check if any account found with the case number PCGYT-2255
            if(String.isNotBlank(CaseNo) && accountList.isEmpty()){
                caseList = Database.query(casesoql);
                system.debug('caseList==>'+caseList);
                if(!caseList.isEmpty()){
                    if(caseList[0].Contact.AccountId != null){
                        accountList = getPrimaryAccount(caseList[0].Contact.AccountId);
                        recordId = caseList[0].Id;
                    }
                }
            }
			system.debug('accountList after case==>'+accountList);
            //If no results returned from case and fin account details
            if(accountList.isEmpty() && (String.isNotBlank(CID) || String.isNotBlank(FirstName)  || String.isNotBlank(LastName)|| String.isNotBlank(Phone) || String.isNotBlank(Email)|| String.isNotBlank(SSN))){
                accountList = Database.query(soql);
            }
            
            result = processRequest(accountList);
            
            
        } catch(Exception ex) {
            result += 'ERROR: ' + ex.getMessage() + ' ' + soql;
            throw new AuraHandledException('Darn it! Something went wrong: '+ result);
        }
        breakGlassCtrl.BreakGlassItemWrpr bgWrpr = new breakGlassCtrl.BreakGlassItemWrpr(accountList,result,recordId);
        return bgWrpr;
    }
    
    @AuraEnabled
    public static List<Account> getPrimaryAccount(Id accountId){
        List<Account> primaryAccountList = [SELECT Id,RecordType.Name,Service__c,Service_fromIRIS__c  FROM Account where Id =: accountId];
        return primaryAccountList;
    }

    @AuraEnabled
    public static string processRequest(List<Account> accountList){
        String result = '';
        String accountId = '';
        String recordTypeName = '';
        string userId = UserInfo.getUserId();
        string userService= '';
        List<String> userServiceList = new List<String>();
        system.debug('accountList.size()==>'+accountList.size());
        if(accountList.isEmpty()){
            result += 'No records found.';
        }else if (accountList.size() > 1)
            result += 'Multiple records found. Please enter additional information to refine the search.';
        else
        {
            //Check if user and account are same service
            //PCGYT-3662 06/13/2023
            userService = [SELECT Id,Service__c  FROM User where Id =: userId LIMIT 1].Service__c;
            recordTypeName = accountList[0].RecordType.Name;
            if(!String.isBlank(userService) ){
                userServiceList = userService.split(';');
            }
            
            if(recordTypeName.equals('Household')){ // for HH Service value is checked
                if(String.isNotBlank(accountList[0].Service__c) && (String.isBlank(userService) || !userServiceList.contains(accountList[0].Service__c))){ //if user service or account service is null/empty then the user doesent have access.
                    result += 'User does not have access to this client\'s service';
                    return result;
                }  
            }else{ // for person account it checks for Service from IRIS
                if(String.isNotBlank(accountList[0].Service_fromIRIS__c) && (String.isBlank(userService) || !userServiceList.contains(accountList[0].Service_fromIRIS__c))){ //if user service or account service is null/empty then the user doesent have access.
                    result += 'User does not have access to this client\'s service';
                    return result;
                } 
            }
            
            accountId = accountList[0].Id;
            system.debug('recordTypeName==>'+recordTypeName);
            Boolean HasReadAccess = [SELECT RecordId,HasReadAccess 
                                     FROM UserRecordAccess 
                                     WHERE UserId = : userId 
                                     AND RecordId = : accountId 
                                     LIMIT 1][0].HasReadAccess;
            system.debug('Has Read Access'+HasReadAccess);
            if (HasReadAccess == false) {
                grantAccountShareAccess(accountId,userId);
                if(recordTypeName.equals('Household')){
                    grantHHAccountTeamMemberAccess(accountId,userId);
                }else{
                    grantAccountTeamMemberAccess(accountId,userId);
                }
                result += 'Break Glass access granted. (Limited 24-Hour Access)';
            } else {
                result += 'Existing Access';
            }   
        }
        return result;
    }
    
    @AuraEnabled
    public static void grantAccountShareAccess(Id accountId,String userId){
        AccountShare asNew = new AccountShare();
        asNew.AccountId = accountId;
        asNew.UserOrGroupId = userId;
        asNew.AccountAccessLevel = 'Edit';
        asNew.OpportunityAccessLevel = 'Edit';
        asNew.CaseAccessLevel = 'Edit';
        asNew.RowCause = 'Manual';
        insert asNew;
    }
    
    @AuraEnabled
    public static void grantAccountTeamMemberAccess(Id accountId,String userId){
        List<AccountTeamMember> accountTeamMemberList = new List<AccountTeamMember>();
        for (AccountContactRelation accountContactRelation : [SELECT AccountId, ContactId FROM 
                                                              AccountContactRelation WHERE Contact.AccountId = : accountId 
                                                              AND IsActive = true 
                                                              AND (EndDate = NULL OR EndDate >= TODAY)]) {
                                                                  AccountTeamMember atm = new AccountTeamMember();
                                                                  atm.AccountId = accountContactRelation.AccountId;
                                                                  atm.UserId = userId;
                                                                  atm.TeamMemberRole = 'Break Glass';
                                                                  atm.AccountAccessLevel = 'Edit';
                                                                  atm.OpportunityAccessLevel = 'Edit';
                                                                  atm.CaseAccessLevel = 'Edit';
                                                                  accountTeamMemberList.add(atm);
                                                              }
        if (!accountTeamMemberList.isEmpty()){
            Database.SaveResult[] srList = Database.insert(accountTeamMemberList, false);
        }else{
            createBreakClassRecord(accountId,userId);
        }
    }
    
    /*******************************************************************************************************************
    * @Author:      Sai Jikkidi
    * @Date:        11/09/2022
    * @Description: This will access to household record. PCGYT-2254
    * @Revision(s):
    *******************************************************************************************************************/
    @AuraEnabled
    public static void grantHHAccountTeamMemberAccess(Id accountId,String userId){
        List<AccountTeamMember> accountTeamMemberList = new List<AccountTeamMember>();
        for (AccountContactRelation accountContactRelation : [SELECT AccountId, ContactId FROM 
                                                              AccountContactRelation WHERE AccountId = : accountId 
                                                              AND IsActive = true 
                                                              AND (EndDate = NULL OR EndDate >= TODAY)]) {
                                                                  AccountTeamMember atm = new AccountTeamMember();
                                                                  atm.AccountId = AccountId;
                                                                  atm.UserId = userId;
                                                                  atm.TeamMemberRole = 'Break Glass';
                                                                  atm.AccountAccessLevel = 'Edit';
                                                                  atm.OpportunityAccessLevel = 'Edit';
                                                                  atm.CaseAccessLevel = 'Edit';
                                                                  accountTeamMemberList.add(atm);
                                                              }
        if (!accountTeamMemberList.isEmpty()){
            Database.SaveResult[] srList = Database.insert(accountTeamMemberList, false);
        }else{
            createBreakClassRecord(accountId,userId);
        }
    }
    
    
    /*******************************************************************************************************************
    * @Author:      Sai Jikkidi
    * @Date:        09/26/2022
    * @Description: This will create breakglass record for persons who do not have a household : Break Glass. PCGYT-2007
    * @Revision(s):
    *******************************************************************************************************************/
    @AuraEnabled
    public static void createBreakClassRecord(Id accountId,String userId) {
        List<Break_Glass__c> breakGlassList = new List<Break_Glass__c>();
        
        Break_Glass__c bg = new Break_Glass__c();
        bg.User__c =  userId;
        bg.Account__c = accountId;
        bg.Access_Expiration_Date__c = DateTime.now().addDays(1);
        breakGlassList.add(bg);  
        
        if(!breakGlassList.isEmpty()){
            Database.SaveResult[] srList = Database.insert(breakGlassList,false);
        }
    }
}
