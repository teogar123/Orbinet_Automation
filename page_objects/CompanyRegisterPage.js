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
    this.companyTypeField = element(by.xpath("//div[@class='companies']//div[2]//img[1]"));


    this.companyRegister = () => {
        actions.enterText(this.companyNameField, "Trucking Docks");
        actions.enterText(this.companyIdField, "Trucking_Docks");
        actions.enterText(this.companyWebPageField, "https://trucking_docks.com");
        actions.enterText(this.countryField, "Mexico");
        actions.enterText(this.postalCodeField, "44560");
        actions.enterText(this.companyIdField, "3313344334");
        actions.enterText(this.stateField, "Jalisco");
        actions.enterText(this.cityField, "Guadalajara");
        actions.enterText(this.addressField, "Rio Churubusco 344");
        actions.clickToElement(this.companyTypeField);
    }

}
module.exports = new CompanyRegisterPage();