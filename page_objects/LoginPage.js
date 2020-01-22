const locators = require('../locators/Locators')
const actions = require('../base/Actions');
const data = require('../test_data/Data');

function LoginPage () {
    this.createAccountButton = element(by.xpath(CREATE_ACCOUNT_BUTTON));
    this.emailField = element(by.xpath(EMAIL_FIELD));
    this.confirmEmailField = element(by.xpath(CONFIRM_EMAIL_FIELD));
    this.passwordField = element(by.xpath(PASSWORD_FIELD));
    this.confirmPassField = element(by.xpath(CONFIRM_PASSWORD_FIELD))

/**
 * 
 * @description Function fot the Create Account Flow!!!
 * 
 */

    this.createAccountFlow = () => {
        actions.isElementDisplayed(this.createAccountButton);
        console.log('Create Account Button Is displayed')
        actions.clickToElement(this.createAccountButton);
        console.log('Create Account Button : Clicked')
        actions.enterText(this.emailField, email);
        console.log('Enter Email : Done')
        actions.enterText(this.confirmEmailField, email);
        console.log('Confirm Email : Done');
        actions.enterText(this.passwordField, password);
        console.log('Enter Password : Done');
        actions.enterText(this.confirmPassField, confpass)
        console.log('Confirm Password : Done');
    }

    
}
module.exports = new LoginPage();