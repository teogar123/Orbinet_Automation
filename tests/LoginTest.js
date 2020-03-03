const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page');
const companyRegisterPage = require('../page_objects/CompanyRegisterPage');


/**
 * 
 * @description Login to Orbinetwork Platform
 * 
 */

beforeAll( function () {
    page.openUrl();
});

describe('Login to OrbinetWork And Register', function (){
    it('Test Start', function () {
        loginPage.createAccountFlow();
        //loginPage.loginToOrbiNetworkPlattform();
        //companyRegisterPage.companyRegister(); 
    })
})