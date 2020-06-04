const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page');
const companyRegisterPage = require('../page_objects/CompanyRegisterPage');
const userProfilePage = require('../page_objects/UserProfilePage');

/**
 * 
 * @description Login to Orbinetwork Platform in Production Environment!!!
 * 
 */

beforeAll( function () {
    page.openUrl();
});

describe('Full Regression Cont, Flotillas etc.', function (){
    it('Test Start', function () {
        //loginPage.createAccountFlow();
        loginPage.loginToOrbiNetworkPlattform();
        userProfilePage.manageProfileFLow();
        //companyRegisterPage.companyRegister(); 
    })
})