@AuraEnabled
public static BreakGlassItemWrpr getAccount(
        string CID, string FirstName, string LastName, string Phone,
        string Email, string SSN, string CustodianAccntNo,
        string FinAccntNo, string AID, string CaseNo) {

    List<Account> accountList = new List<Account>();
    List<FinServ__FinancialAccount__c> finAccntList = new List<FinServ__FinancialAccount__c>();
    List<Case> caseList = new List<Case>();
    String result = '';
    String recordId = '';

    List<String> soqlConditions = new List<String>();
    if (String.isNotBlank(CID)) {
        soqlConditions.add('CID__c = :CID');
    }
    if (String.isNotBlank(FirstName)) {
        soqlConditions.add('FirstName LIKE :FirstName');
    }
    if (String.isNotBlank(LastName)) {
        soqlConditions.add('LastName = :LastName');
    }
    if (String.isNotBlank(Phone)) {
        soqlConditions.add('Phone = :Phone');
    }
    if (String.isNotBlank(Email)) {
        soqlConditions.add('PersonEmail = :Email');
    }
    if (String.isNotBlank(SSN)) {
        soqlConditions.add('SSN_Tax_ID_Last_Four_Digits__pc = :SSN');
    }

    String soqlCondition = '';
    if (!soqlConditions.isEmpty()) {
        soqlCondition = ' WHERE ' + String.join(soqlConditions, ' AND ');
    }

    String soql = 'SELECT Id, (SELECT ContactId FROM AccountContactRelations) ' +
                  'FROM Account' + soqlCondition;

    try {
        if (!soqlConditions.isEmpty()) {
            accountList = Database.query(soql);
        }
        List<String> finAccntConditions = new List<String>();
        if (String.isNotBlank(CustodianAccntNo)) {
            finAccntConditions.add('Custodian_Account_Number__c = :CustodianAccntNo');
        }
        if (String.isNotBlank(FinAccntNo)) {
            finAccntConditions.add('FIN_Account_Number__c = :FinAccntNo');
        }
        if (String.isNotBlank(AID)) {
            finAccntConditions.add('AID_Account_Number__c = :AID');
        }

        String finAccntCondition = '';
        if (!finAccntConditions.isEmpty()) {
            finAccntCondition = ' WHERE ' + String.join(finAccntConditions, ' OR ');
        }

        String finAccntsoql = 'SELECT Id,FinServ__PrimaryOwner__c,FinServ__Household__c FROM FinServ__FinancialAccount__c' + finAccntCondition + ' LIMIT 1';

        // Build casesoql dynamically
        String casesoql = 'SELECT Id,ContactId,Contact.AccountId,CaseNumber FROM Case';
        if (String.isNotBlank(CaseNo)) {
            casesoql += ' WHERE CaseNumber = :CaseNo LIMIT 1';
        }

        // Check if any account found with the financial Account details
        if(!finAccntConditions.isEmpty()){
            finAccntList = Database.query(finAccntsoql);
            if(!finAccntList.isEmpty()){
                if(finAccntList[0].FinServ__PrimaryOwner__c != null){
                    accountList = getPrimaryAccount(finAccntList[0].FinServ__PrimaryOwner__c);
                    recordId = finAccntList[0].FinServ__Household__c;
                }
            }
        }

        // Check if any account found with the case number
        if(String.isNotBlank(CaseNo) && accountList.isEmpty()){
            caseList = Database.query(casesoql);
            if(!caseList.isEmpty()){
                if(caseList[0].Contact.AccountId != null){
                    accountList = getPrimaryAccount(caseList[0].Contact.AccountId);
                    recordId = caseList[0].Id;
                }
            }
        }

        // If no results returned from case and fin account details and soql conditions were provided
        if(accountList.isEmpty() && !soqlConditions.isEmpty()){
            accountList = Database.query(soql);
        }
        
        result = processRequest(accountList);

    } catch(Exception ex) {
        String errorMessage = 'ERROR: ' + ex.getMessage() + ' SOQL: ' + soql;
        throw new AuraHandledException('Darn it! Something went wrong: ' + errorMessage);
    }

    BreakGlassCtrl.BreakGlassItemWrpr bgWrpr = new BreakGlassCtrl.BreakGlassItemWrpr(accountList, result, recordId);
    return bgWrpr;
}
