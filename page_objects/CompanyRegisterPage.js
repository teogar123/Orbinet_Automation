const locators = require('../locators/Locators')
const actions = require('../base/Actions');
const data = require('../test_data/Data');

function CompanyRegisterPage () {

    this.companyNameField = element(by.xpath("//input[@name='companyName']"));
    this.companyIdField = element(by.xpath("//input[@name='idOrbi']"));
    this.companyWebPageField = element(by.xpath("//input[@name='webPage']"));
    this.countryField = element(by.xpath("//select[@id='country']"));
    this.postalCodeField = element(by.xpath("//input[@name='postalCode']"));
    this.phoneField = element(by.xpath("//input[@name='phone']"));
    this.stateField = element(by.xpath("//select[@id='state']"));
    this.cityField = element(by.xpath("//select[@id='city']"));
    this.addressField = element(by.xpath("//input[@name='address']"));
    this.companyTypeButton = element(by.xpath("//b[contains(text(),'Transportista')]"));
    this.nextButton = element(by.xpath("//button[contains(@class,'btn primary')]"));
    this.selectYourState = element(by.xpath("//select[@id='state']"));
    this.selectYourCity = element(by.xpath("//select[@id='city']"));


    this.companyRegister = () => {
        actions.enterText(this.companyNameField, "Trucking Docks");
        actions.enterText(this.companyIdField, "Trucking_Docks");
        actions.enterText(this.companyWebPageField, "www.trucks.com");
        //actions.enterText(this.countryField, "Mexico");
        actions.enterText(this.postalCodeField, "44560");
        actions.enterText(this.companyIdField, "3313344334");
        actions.enterText(this.stateField, "Jalisco");
        actions.enterText(this.cityField, "Guadalajara");
        actions.enterText(this.selectYourState, 'Aguas');
        browser.sleep(2000);
        actions.enterText(this.selectYourCity, 'Aguas');
        browser.sleep(4000)
        actions.enterText(this.addressField, "Rio Churubusco 344");
        actions.clickToElement(this.companyTypeButton);
        browser.sleep(4000)
        actions.clickToElement(this.nextButton);
        browser.sleep(7000)

    }

}
module.exports = new CompanyRegisterPage();