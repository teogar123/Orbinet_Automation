const locators = require('../locators/Locators')
const actions = require('../base/Actions');
const randomData = require('../test_data/Data');
const { element, browser } = require('protractor');
const { waitForElementVisibility, waitForElementPresence, waitForElementNotToBePresent, scrollToElement } = require('protractor-helper');
const random = require('../test_data/random');
const { randomName, randomDataGenerator } = require('../test_data/random');
const { Driver } = require('selenium-webdriver/chrome');
//const  randomInfo = require('../test_data/random').randomInfo();

function CompanyRegisterPage () {

    this.userProfileButton = element(by.xpath('//*[@class="user-avatar"]'));
    this.companyElipsisMenu = element(by.xpath('//div[@class="ellipsis"]'));
    this.optionsGearLogoToCreateACompany = element(by.xpath('//*[@id="pageContent"]/div/div/div[2]/div/div[1]'));
    this.createCompanyFromGearToolTip = element(by.xpath('//*[@id="pageContent"]/div/div/div[2]/div/div[2]/a'));
    this.createCompanyOption = element(by.xpath('//span[@id="tooltipLink"]'));
    this.companyNameField = element(by.xpath("//input[@name='companyName']"));
    this.companyIdField = element(by.xpath("//input[@name='idOrbi']"));
    this.companyWebPageField = element(by.xpath("//input[@name='webPage']"));
    this.countryField = element(by.xpath("//select[@id='country']"));
    this.mexicoCountryOption = element(by.xpath('//*[@id="country"]/option[158]'));
    this.postalCodeField = element(by.xpath("//input[@name='postalCode']"));
    this.phoneField = element(by.xpath("//input[@name='phone']"));
    this.stateField = element(by.xpath("//select[@id='state']"));
    this.cityField = element(by.xpath("//select[@id='city']"));
    this.addressField = element(by.xpath("//input[@name='address']"));
    this.exteriorNumber = element(by.xpath('//input[@name="extNumber"]'));
    this.companyTypeButton = element(by.xpath("//*[contains(text(),'Transportista')]"));
    this.nextButton = element(by.xpath("//button[contains(@class,'btn primary')]"));
    this.selectYourState = element(by.xpath("//select[@id='state']"));
    this.selectYourCity = element(by.xpath("//select[@id='city']"));
    this.companyRegistrationHeader = element(by.xpath('//*[@id="pageContent"]/div/h1[1]'));

    
            
    this.companyRegister = () => {

        var x = "qwertyuioplkjhgfdsazxcvbnm";
        var name = "";   
        for (var i = 0; i < 6; i++) {
        NAME = name += x.charAt(Math.ceil(25 * Math.random()));
        ID = name += x.charAt(Math.ceil(25 * Math.random()));
    }
            
            
            actions.clickToElement(this.optionsGearLogoToCreateACompany);
            actions.clickToElement(this.createCompanyFromGearToolTip);
            waitForElementPresence(this.companyRegistrationHeader);
            actions.enterText(this.companyNameField, NAME);
            actions.enterText(this.companyIdField, ID);
            actions.enterText(this.companyWebPageField, "www.trucks.com");
            actions.enterText(this.countryField, "m");
            actions.clickToElement(this.mexicoCountryOption);
            actions.enterText(this.postalCodeField, "44560");
            //actions.enterText(this.companyIdField, "3313344334");
            /*actions.enterText(this.stateField, "Jalisco");
            actions.enterText(this.cityField, "Guadalajara");
            actions.enterText(this.selectYourState, 'Aguas');
            browser.sleep(2000);
            */actions.enterText(this.selectYourCity, 'Aguas');
            browser.sleep(3000)
            actions.enterText(this.addressField, "Rio Churubusco");
            actions.enterText(this.exteriorNumber, '344');
            actions.clickToElement(this.companyTypeButton);
            browser.sleep(2000)
            actions.clickToElement(this.nextButton);
            console.count('ADDING NEW COMPANY : COMPLETE');
            browser.sleep(5000);
    }
                  
}
module.exports = new CompanyRegisterPage();