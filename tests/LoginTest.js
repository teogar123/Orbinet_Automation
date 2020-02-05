const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page')


/**
 * 
 * @description Login to Orbinetwork Platform
 * 
 */

beforeAll( function () {
    page.openUrl();
});

describe('Login to OrbinetWork', function (){
    it('Test Start', function () {
        //loginPage.createAccountFlow();
        loginPage.loginToOrbiNetworkPlattform(); 
    })
})