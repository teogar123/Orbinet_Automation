const locators = require('../locators/Locators')
const actions = require('../base/Actions');
const data = require('../test_data/Data');
const protractorHelper = require('protractor-helper');
const path = require('path');



function LoginPage () {
    this.createAccountButton = element(by.xpath(CREATE_ACCOUNT_BUTTON));
    this.emailField = element(by.xpath(EMAIL_FIELD));
    this.confirmEmailField = element(by.xpath(CONFIRM_EMAIL_FIELD));
    this.passwordField = element(by.xpath(PASSWORD_FIELD));
    this.confirmPassField = element(by.xpath(CONFIRM_PASSWORD_FIELD))
    this.checkBox = element(by.xpath('/html[1]/body[1]/div[7]/div[1]/div[2]/div[4]/div[1]/div[1]/div[1]'));
    this.createAccountSubmitButton = element(by.xpath("//div[@class='ozine-popup create-account']//span[contains(text(),'Crear tu cuenta')]"));
    this.loginOrbiButton = element(by.xpath("//div[@class='form']//span[contains(text(),'Iniciar sesión')]"));
    this.emailToLginField = element(by.xpath("/html[1]/body[1]/div[6]/div[1]/div[2]/div[1]/input[1]"));
    this.passwordToLoginField = element(by.xpath("/html[1]/body[1]/div[6]/div[1]/div[2]/div[2]/input[1]"));
    this.loginToOrbiButton = element(by.xpath('/html[1]/body[1]/div[6]/div[1]/div[2]/div[4]/div[2]/b[1]/span[1]'));
    this.orbiNetworwLogo = element(by.xpath("//img[@class='logo']"));
    this.toUploadPhoto = element(by.xpath("//button[contains(@class,'btn button outline btnPicture')]"));
    
    
/**
 * 
 * @description Function for the Create Account Flow!!!
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
        browser.sleep(4000);
        actions.clickToElement(this.checkBox);
        browser.sleep(4000);
        console.log('Check Box : Clicked and Checked');
        //Just Provisional time sleep
        actions.clickToElement(this.createAccountButton);
        //browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.sleep(6000);
    };
    
    this.loginToOrbiNetworkPlattform = () => {
        actions.clickToElement(this.loginOrbiButton);
        actions.enterText(this.emailToLginField, 'teo_753487@mailinator.com');
        browser.sleep(4000);
        actions.enterText(this.passwordToLoginField, "Teddy_310");
        browser.sleep(4000);
        actions.clickToElement(this.loginToOrbiButton);
        browser.sleep(4000);
        if (this.orbiNetworwLogo.isDisplayed) {
            console.log('The ORBI logo is Present-> ' + "Loggin : Successfull");
        } else {
            console.log("ORBI log is MISSING : Loggin Nor Succesfull");
        };

        browser.sleep(4000);
        //helper.uploadFileIntoInputField(this.toUploadPhoto, this.absolutePath, 4000);
        
        const relativePathOfFileToUpload = "../page_obnjects/photo.png";
        const absolutePathOfFileToUpload = path.resolve(__dirname, relativePathOfFileToUpload);

        browser.get("https://qa.v2.orbinetwork.com/register/account");

        const fileInputField = element
        (by.xpath("/html[1]/body[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[2]/div[3]/div[1]/button[1]"));
        if (fileInputField.isDisplayed) {
            console.log('The Element is present and Will Allow to Upload the require File -> : Success');
        } else {
            console.log('The Element is Not Diplayed and Will Allow to Upload the require file -> : Failed');
        }
        protractorHelper.uploadFileIntoInputField(fileInputField, absolutePathOfFileToUpload);
        browser.sleep(6000);     
    }
};
module.exports = new LoginPage();