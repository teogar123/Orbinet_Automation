const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page');
const companyRegisterPage = require('../page_objects/CompanyRegisterPage');
const userProfilePage = require('../page_objects/UserProfilePage');

/**
 * 
 * @description Manage Profile to select Permissions, Allerts and Notifications!!!
 * 
 */

beforeAll( function () {
    page.openUrl();
});

describe('Manage Profile Test', function (){
    it('Test Start', function () {
        //loginPage.createAccountFlow();
        loginPage.loginToOrbiNetworkPlattform();
        userProfilePage.manageProfileFLow();
        //companyRegisterPage.companyRegister(); 
    })
})