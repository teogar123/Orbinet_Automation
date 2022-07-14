const locators = require('../locators/Locators')
const actions = require('../base/Actions');
const data = require('../test_data/Data');


function UserProfilePage () {
    this.userProfileButton = element(by.xpath('//*[@class="user-avatar"]'));
    this.permisosTab = element(by.xpath("//span[@id='permisos']"));
    this.alertasTab = element(by.xpath("//span[@id='alertas']"));
    this.notificacionesTab = element(by.xpath("//span[@id='notificaciones']"));
    this.configurationFoldDownMenu = element(by.xpath("//div[@class='content']//div[2]//a[1]//img[1]"));
    this.facilityTab = element(by.xpath("//div[3]//div[2]//a[1]//span[1]"));
    this.createFacilityButton = element(by.xpath("//button[text()='Crear']"));
    this.registerTitle = element(by.xpath("//div[contains(text(),'Registro de instalación')]"));

    /**
     * 
     * @dessciption Manage the User Profile view
     * 
     */

    this.manageProfileFLow = () => {
        actions.clickToElement(this.userProfileButton);
        browser.sleep(4000)
        

        this.permisosTab + this.alertasTab + 
        this.notificacionesTab.isPresent().then(function (isPresent){
            if (isPresent) {
                console.log('The Three Elements are Present and ready to be Clickeable');
            }else {
                console.log('Any or Some of the elements are not Present : Check with Dev Team');
            }
        })


        browser.sleep(3000);
        
        const arrayElements = [this.permisosTab,
             this.alertasTab, this.notificacionesTab];
        console.log(arrayElements.length)
        arrayElements.forEach(function(arrayElement){
            actions.clickToElement(arrayElement);
            console.log("Is present and clicked")
        });
        browser.sleep(3000);             
     };

    this.createFacility = () => {
        if (this.configurationFoldDownMenu.isPresent() ){
            console.log('Configuration Menu is Displayed');
        }else {
            console.log('Config Menu Is not Displayed');
        };

        actions.clickToElement(this.configurationFoldDownMenu);
        browser.sleep(3000);

        if (this.facilityTab.isPresent()) {
            console.log("The Facility tab is Displayes and is Clickable");
        }else {
            console.log('Is not Clickable and must Interrupy the Test Run');
        };

        //browser.sleep(3000);
        actions.clickToElement(this.facilityTab);
        browser.sleep(4000);

        actions.clickToElement(this.createFacilityButton);
        browser.sleep(3000);

        this.registerTitle.isPresent().then(function (isPresent){
            if (isPresent) {
                console.log('The Register Title is Present : Please Fullfill the Form');
            }else {
                console.log('The Register Title is not Present : Please Check with dev Team About the Issu');
            }
        })
    };

}
module.exports = new UserProfilePage();